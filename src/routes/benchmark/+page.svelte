<script lang="ts">
	interface Timing {
		count: number;
		ms: number;
	}
	interface Result {
		limit: number;
		js: Timing;
		rust: Timing;
		rustAsync: Timing;
	}

	const limits = [
		{ value: 1_000_000, label: '1 million' },
		{ value: 5_000_000, label: '5 million' },
		{ value: 10_000_000, label: '10 million' },
		{ value: 30_000_000, label: '30 million' }
	];

	let limit = $state(5_000_000);
	let result = $state<Result | null>(null);
	let running = $state(false);
	let errorMsg = $state('');

	const bars = $derived(
		result
			? [
					{ label: 'JavaScript (same algorithm)', cls: 'js', ...result.js },
					{ label: 'Rust — sync call', cls: 'rust', ...result.rust },
					{ label: 'Rust — cx.task → Promise', cls: 'rust', ...result.rustAsync }
				]
			: []
	);
	const maxMs = $derived(Math.max(...bars.map((b) => b.ms), 1));

	async function run() {
		running = true;
		errorMsg = '';
		try {
			const res = await fetch('/api/primes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ limit })
			});
			if (!res.ok) throw new Error((await res.json()).message ?? res.statusText);
			result = await res.json();
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : String(err);
		} finally {
			running = false;
		}
	}

	const fmt = new Intl.NumberFormat('en-US');
</script>

<h1>CPU-bound benchmark: prime sieve</h1>
<p class="intro">
	Counts primes below a limit with a sieve of Eratosthenes — the identical algorithm implemented
	twice. The JavaScript version runs in the SvelteKit server route; the Rust version is called
	through the Neon addon, both synchronously and via
	<code>cx.task(…).promise()</code>, which does the work on Node's worker thread pool while the
	event loop stays free.
</p>

<div class="card">
	<div class="controls">
		<label>
			Primes below
			<select bind:value={limit}>
				{#each limits as { value, label } (value)}
					<option {value}>{label}</option>
				{/each}
			</select>
		</label>
		<button onclick={run} disabled={running}>
			{running ? 'Running…' : 'Run benchmark'}
		</button>
	</div>

	{#if errorMsg}
		<p class="error">{errorMsg}</p>
	{/if}

	{#if result}
		<p class="verdict">
			{fmt.format(result.rust.count)} primes below {fmt.format(result.limit)} — Rust was
			<strong>{(result.js.ms / result.rust.ms).toFixed(1)}×</strong> faster than JavaScript on this
			run.
		</p>
		<div class="chart">
			{#each bars as bar (bar.label)}
				<div class="row">
					<span class="label">{bar.label}</span>
					<div class="track">
						<div class="bar {bar.cls}" style="width: {(bar.ms / maxMs) * 100}%"></div>
						<span class="ms">{bar.ms.toFixed(1)} ms</span>
					</div>
				</div>
			{/each}
		</div>
		<p class="note">
			Numbers vary per run and machine — warm-up, allocation, and the ~µs cost of crossing the
			JS↔Rust boundary all play a part. The async variant adds thread-pool scheduling overhead in
			exchange for not blocking the event loop.
		</p>
	{/if}
</div>

<style>
	.intro {
		color: var(--text-dim);
		max-width: 46rem;
		margin-bottom: 1.5rem;
	}

	.controls {
		display: flex;
		align-items: end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.9rem;
		color: var(--text-dim);
	}

	.error {
		color: #f87171;
	}

	.verdict {
		margin-top: 1.4rem;
	}

	.verdict strong {
		color: var(--rust);
		font-size: 1.15em;
	}

	.chart {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
		margin-top: 1rem;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(150px, 220px) 1fr;
		align-items: center;
		gap: 0.8rem;
		font-size: 0.88rem;
	}

	.label {
		color: var(--text-dim);
		text-align: right;
	}

	.track {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.bar {
		height: 1.3rem;
		border-radius: 4px;
		min-width: 3px;
		transition: width 0.4s ease;
	}

	.bar.js {
		background: var(--js);
	}

	.bar.rust {
		background: var(--rust);
	}

	.ms {
		font-family: var(--mono);
		font-size: 0.8rem;
		white-space: nowrap;
	}

	.note {
		color: var(--text-dim);
		font-size: 0.85rem;
		margin-top: 1.2rem;
		margin-bottom: 0;
	}
</style>
