<script lang="ts">
	interface Stats {
		totalWords: number;
		uniqueWords: number;
		topWords: { word: string; count: number }[];
		ms: number;
	}
	interface WordResult {
		rust: Stats;
		js: Stats;
	}
	interface HashResult {
		rounds: number;
		rust: { hash: string; ms: number };
		node: { hash: string; ms: number };
		match: boolean;
	}

	const sample = `Neon is a library for writing safe and fast native Node.js modules in Rust.
Safe: Neon translates Rust's memory safety guarantees to the world of Node addons,
so common addon crashes become compile errors instead. Fast: Rust code compiles to
native machine code, and Neon keeps the overhead of crossing between JavaScript and
Rust small. This demo counts words in Rust with a HashMap and hands the result back
to JavaScript as a plain object — no serialization step, no JSON in between.`;

	let text = $state(sample);
	let wordResult = $state<WordResult | null>(null);
	let analyzing = $state(false);

	let hashInput = $state('meetup');
	let rounds = $state(1_000_000);
	let hashResult = $state<HashResult | null>(null);
	let hashing = $state(false);

	async function analyze() {
		analyzing = true;
		try {
			const res = await fetch('/api/wordstats', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ text })
			});
			if (res.ok) wordResult = await res.json();
		} finally {
			analyzing = false;
		}
	}

	async function hash() {
		hashing = true;
		try {
			const res = await fetch('/api/hash', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ text: hashInput, rounds })
			});
			if (res.ok) hashResult = await res.json();
		} finally {
			hashing = false;
		}
	}

	const fmt = new Intl.NumberFormat('en-US');
	const maxCount = $derived(
		wordResult ? Math.max(...wordResult.rust.topWords.map((w) => w.count), 1) : 1
	);
</script>

<h1>Structured data & crates.io</h1>

<section class="card">
	<h2>Demo 2 — Rust <code>HashMap</code> → JS object</h2>
	<p class="intro">
		The addon's <code>wordStats()</code> tokenizes the text, counts words in a Rust
		<code>HashMap</code>, and builds the response with Neon's object API
		(<code>cx.empty_object()</code>, <code>obj.set(…)</code>) — the JS side receives a plain
		object, no JSON serialization involved.
	</p>
	<textarea rows="7" bind:value={text}></textarea>
	<div class="actions">
		<button onclick={analyze} disabled={analyzing || !text.trim()}>
			{analyzing ? 'Analyzing…' : 'Analyze in Rust'}
		</button>
	</div>

	{#if wordResult}
		<div class="stats">
			<div class="stat">
				<span class="num">{fmt.format(wordResult.rust.totalWords)}</span>
				<span class="cap">total words</span>
			</div>
			<div class="stat">
				<span class="num">{fmt.format(wordResult.rust.uniqueWords)}</span>
				<span class="cap">unique words</span>
			</div>
			<div class="stat">
				<span class="num">{wordResult.rust.ms.toFixed(2)} ms</span>
				<span class="cap">Rust</span>
			</div>
			<div class="stat">
				<span class="num">{wordResult.js.ms.toFixed(2)} ms</span>
				<span class="cap">JavaScript</span>
			</div>
		</div>
		<div class="words">
			{#each wordResult.rust.topWords as { word, count } (word)}
				<div class="word-row">
					<span class="word">{word}</span>
					<div class="track">
						<div class="bar" style="width: {(count / maxCount) * 100}%"></div>
						<span class="count">{count}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<section class="card">
	<h2>Demo 3 — Any crate, callable from JS</h2>
	<p class="intro">
		Iterated SHA-256 using the <code>sha2</code> crate from crates.io, compared against Node's
		built-in <code>node:crypto</code> (itself native OpenSSL — so expect a close race; the point is
		that the whole Rust ecosystem is one <code>cargo add</code> away).
	</p>
	<div class="hash-controls">
		<label>
			Input
			<input type="text" bind:value={hashInput} />
		</label>
		<label>
			Rounds
			<select bind:value={rounds}>
				<option value={100_000}>100 thousand</option>
				<option value={1_000_000}>1 million</option>
				<option value={5_000_000}>5 million</option>
			</select>
		</label>
		<button onclick={hash} disabled={hashing || !hashInput}>
			{hashing ? 'Hashing…' : 'Hash it'}
		</button>
	</div>

	{#if hashResult}
		<div class="hash-result">
			<div class="hash-line">
				<span class="who rust-c">Rust (sha2)</span>
				<code class="digest">{hashResult.rust.hash}</code>
				<span class="ms">{hashResult.rust.ms.toFixed(1)} ms</span>
			</div>
			<div class="hash-line">
				<span class="who js-c">node:crypto</span>
				<code class="digest">{hashResult.node.hash}</code>
				<span class="ms">{hashResult.node.ms.toFixed(1)} ms</span>
			</div>
			<p class="match" class:ok={hashResult.match}>
				{hashResult.match
					? '✓ digests match across implementations'
					: '✗ digests differ — that would be a bug!'}
			</p>
		</div>
	{/if}
</section>

<style>
	section {
		margin-bottom: 1.5rem;
	}

	h1 {
		margin-bottom: 1.5rem;
	}

	h2 {
		margin-top: 0;
	}

	.intro {
		color: var(--text-dim);
		max-width: 46rem;
	}

	textarea {
		width: 100%;
	}

	.actions {
		margin-top: 0.8rem;
	}

	.stats {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
		margin: 1.4rem 0;
	}

	.stat {
		display: flex;
		flex-direction: column;
	}

	.num {
		font-size: 1.4rem;
		font-weight: 700;
		font-family: var(--mono);
	}

	.cap {
		color: var(--text-dim);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.words {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.word-row {
		display: grid;
		grid-template-columns: 110px 1fr;
		align-items: center;
		gap: 0.8rem;
		font-size: 0.88rem;
	}

	.word {
		font-family: var(--mono);
		text-align: right;
		color: var(--text-dim);
	}

	.track {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.bar {
		height: 1.1rem;
		border-radius: 4px;
		min-width: 3px;
		background: var(--rust);
		transition: width 0.4s ease;
	}

	.count {
		font-family: var(--mono);
		font-size: 0.8rem;
	}

	.hash-controls {
		display: flex;
		align-items: end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.hash-controls label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.9rem;
		color: var(--text-dim);
	}

	.hash-result {
		margin-top: 1.4rem;
	}

	.hash-line {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
	}

	.who {
		flex: 0 0 7.5rem;
		font-weight: 600;
		font-size: 0.88rem;
	}

	.rust-c {
		color: var(--rust);
	}

	.js-c {
		color: var(--js);
	}

	.digest {
		font-size: 0.75rem;
		overflow-wrap: anywhere;
		flex: 1 1 20rem;
	}

	.ms {
		font-family: var(--mono);
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.match {
		color: #f87171;
		font-size: 0.88rem;
	}

	.match.ok {
		color: var(--green);
	}
</style>
