import type { WordStats } from './native';

// Pure-JavaScript equivalents of the Rust functions, used as the
// baseline in the benchmarks. Same algorithms, same semantics.

export function countPrimesJs(limit: number): number {
	if (limit < 2) return 0;
	const isComposite = new Uint8Array(limit + 1);
	let count = 0;
	for (let n = 2; n <= limit; n++) {
		if (!isComposite[n]) {
			count++;
			for (let multiple = n * n; multiple <= limit; multiple += n) {
				isComposite[multiple] = 1;
			}
		}
	}
	return count;
}

export function wordStatsJs(text: string, topN: number): WordStats {
	const counts = new Map<string, number>();
	let total = 0;
	for (const word of text.split(/[^\p{L}\p{N}']+/u)) {
		if (!word) continue;
		total++;
		const key = word.toLowerCase();
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const ranked = [...counts.entries()].sort(
		(a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
	);
	return {
		totalWords: total,
		uniqueWords: ranked.length,
		topWords: ranked.slice(0, topN).map(([word, count]) => ({ word, count }))
	};
}
