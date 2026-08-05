<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Overview' },
		{ href: '/benchmark', label: 'Benchmark' },
		{ href: '/text', label: 'Text & Hashing' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Rust Neon × SvelteKit</title>
</svelte:head>

<header>
	<div class="inner">
		<a href="/" class="brand">
			<span class="crab">🦀</span> neon<span class="accent">-demo</span>
		</a>
		<nav>
			{#each links as { href, label } (href)}
				<a {href} class:active={page.url.pathname === href}>{label}</a>
			{/each}
		</nav>
	</div>
</header>

<main>
	{@render children()}
</main>

<footer>
	Rust compiled to a native Node.js addon with
	<a href="https://neon-rs.dev" target="_blank" rel="noreferrer">Neon</a>, called from SvelteKit
	server routes.
</footer>

<style>
	header {
		border-bottom: 1px solid var(--border);
		background: rgba(13, 16, 23, 0.85);
		backdrop-filter: blur(8px);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.inner {
		max-width: 960px;
		margin: 0 auto;
		padding: 0.8rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.brand {
		font-weight: 700;
		font-size: 1.05rem;
		color: var(--text);
		text-decoration: none;
	}

	.brand .accent {
		color: var(--rust);
	}

	.crab {
		margin-right: 0.3rem;
	}

	nav {
		display: flex;
		gap: 0.25rem;
	}

	nav a {
		color: var(--text-dim);
		text-decoration: none;
		font-size: 0.92rem;
		font-weight: 500;
		padding: 0.35rem 0.8rem;
		border-radius: 8px;
	}

	nav a:hover {
		color: var(--text);
	}

	nav a.active {
		color: var(--rust);
		background: var(--rust-soft);
	}

	main {
		max-width: 960px;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}

	footer {
		border-top: 1px solid var(--border);
		color: var(--text-dim);
		font-size: 0.85rem;
		text-align: center;
		padding: 1.5rem;
	}
</style>
