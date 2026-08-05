# rust-neon-demo

A SvelteKit app showcasing [Neon](https://neon-rs.dev) — writing native Node.js
addons in safe Rust and calling them from SvelteKit server routes.

## What it demonstrates

| Demo | Neon feature |
| --- | --- |
| **Overview** — greeting | Basic value passing: `JsString` in, `JsString` out |
| **Benchmark** — prime sieve | CPU-bound Rust vs identical JavaScript; `cx.task(…).promise()` running Rust on Node's worker thread pool and returning a `Promise` |
| **Text & Hashing** — word stats | Building structured JS objects from a Rust `HashMap` (`cx.empty_object()`, `obj.set`) |
| **Text & Hashing** — SHA-256 | Using any crates.io dependency (`sha2`) behind a JS-callable function |

## Architecture

```
Browser (Svelte pages)
   │  fetch('/api/…')
   ▼
SvelteKit server routes (src/routes/api/*/+server.ts)   ← Node.js
   │  createRequire()('native/index.node')
   ▼
Rust crate (native/src/lib.rs), compiled with Neon      ← Rust
```

- `native/` — the Rust crate; `crate-type = ["cdylib"]`, depends on `neon = "1"`.
- `scripts/build-native.mjs` — runs `cargo build --release` and copies the
  platform library (`.dylib`/`.so`/`.dll`) to `native/index.node`.
- `src/lib/server/native.ts` — loads the addon with `createRequire` (`.node`
  addons are CommonJS) and gives it a TypeScript interface.
- `src/lib/server/js-impl.ts` — pure-JS implementations of the same algorithms,
  used as the benchmark baseline.

## Prerequisites

- Node.js ≥ 20
- Rust toolchain (`rustup`, stable)

## Developing

```sh
pnpm i
pnpm run dev        # builds the Rust addon first (predev), then starts Vite
```

The addon rebuild is a no-op when the Rust code hasn't changed (cargo caches).
After editing `native/src/lib.rs`, restart `npm run dev` or run
`npm run build:native`.

## Building

```sh
pnpm run build
pnpm run preview
```

Note: `index.node` is a platform-specific binary — it must be built on (or
cross-compiled for) the OS/arch where the server runs.
