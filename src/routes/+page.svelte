<script lang="ts">
	let name = $state('');
	let greeting = $state('');
	let loading = $state(false);

	async function greet(event: SubmitEvent) {
		event.preventDefault();
		loading = true;
		try {
			const res = await fetch(`/api/greet?name=${encodeURIComponent(name)}`);
			greeting = (await res.json()).message;
		} finally {
			loading = false;
		}
	}
</script>

<section class="hero">
	<h1>Rust in your SvelteKit backend, <span class="accent">no FFI pain</span></h1>
	<p class="lede">
		This app showcases <a href="https://neon-rs.dev" target="_blank" rel="noreferrer">Neon</a> — a
		library for writing native Node.js addons in safe Rust. The Rust crate in
		<code>native/</code> compiles to <code>index.node</code>, which SvelteKit server routes call
		like any other module.
	</p>
</section>

<section class="card demo">
	<h2>Demo 1 — Cross the boundary</h2>
	<p>
		This calls <code>GET /api/greet</code>, which invokes the Rust function
		<code>greet()</code> exported by the addon: a JS string goes in, a Rust
		<code>format!</code> result comes back.
	</p>
	<form onsubmit={greet}>
		<input type="text" placeholder="Your name" bind:value={name} aria-label="Your name" />
		<button disabled={loading}>Call Rust</button>
	</form>
	{#if greeting}
		<p class="greeting">{greeting}</p>
	{/if}
</section>

<section class="grid">
	<div class="card">
		<h3>How it flows</h3>
		<pre><code>Browser (Svelte)
   │  fetch('/api/…')
   ▼
SvelteKit +server.ts        ← Node.js
   │  native.countPrimes(n)
   ▼
native/index.node           ← Rust via Neon
</code></pre>
	</div>
	<div class="card">
		<h3>The Rust side</h3>
		<pre><code>fn greet(mut cx: FunctionContext)
    -&gt; JsResult&lt;JsString&gt; &#123;
  let name = cx.argument::&lt;JsString&gt;(0)?
    .value(&amp;mut cx);
  Ok(cx.string(
    format!("Hello, &#123;name&#125;! 🦀")))
&#125;</code></pre>
	</div>
</section>

<section class="features">
	<h2>What the demos cover</h2>
	<ul>
		<li>
			<strong><a href="/benchmark">Benchmark</a></strong> — a CPU-bound prime sieve in Rust vs the
			identical algorithm in JavaScript, plus Neon's <code>cx.task(…).promise()</code> API that runs
			Rust on Node's worker thread pool and returns a real <code>Promise</code>.
		</li>
		<li>
			<strong><a href="/text">Text & Hashing</a></strong> — building structured JS objects from Rust
			(<code>HashMap</code> → <code>JsObject</code>), and pulling in any crates.io dependency
			(<code>sha2</code>) behind a JS-callable function.
		</li>
	</ul>
</section>

<style>
	.hero h1 {
		font-size: 2.1rem;
		margin-bottom: 0.5rem;
	}

	.accent {
		color: var(--rust);
	}

	.lede {
		color: var(--text-dim);
		font-size: 1.05rem;
		max-width: 46rem;
	}

	.demo {
		margin: 2rem 0;
	}

	.demo h2 {
		margin-top: 0;
	}

	form {
		display: flex;
		gap: 0.6rem;
		margin-top: 1rem;
	}

	input {
		flex: 0 1 16rem;
	}

	.greeting {
		margin-top: 1rem;
		font-weight: 600;
		color: var(--green);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.grid h3 {
		margin-top: 0;
	}

	.features {
		margin-top: 2.5rem;
	}

	.features li {
		margin-bottom: 0.7rem;
	}
</style>
