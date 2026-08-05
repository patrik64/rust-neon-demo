import { createRequire } from 'node:module';
import path from 'node:path';

export interface WordStats {
	totalWords: number;
	uniqueWords: number;
	topWords: { word: string; count: number }[];
}

export interface NativeAddon {
	/** String in, string out — the "hello world" of Neon. */
	greet(name: string): string;
	/** CPU-bound sieve of Eratosthenes, runs on the JS thread. */
	countPrimes(limit: number): number;
	/** Same sieve on Node's worker thread pool, returned as a Promise. */
	countPrimesAsync(limit: number): Promise<number>;
	/** Rust HashMap-based analysis returned as a structured JS object. */
	wordStats(text: string, topN: number): WordStats;
	/** Iterated SHA-256 via the `sha2` crate from crates.io. */
	sha256(text: string, rounds: number): string;
}

// .node addons are CommonJS artifacts, so we load them with a require()
// bridge instead of an ESM import — this also keeps Vite from trying to
// bundle the binary.
const require = createRequire(import.meta.url);

export const native: NativeAddon = require(
	path.join(process.cwd(), 'native', 'index.node')
);
