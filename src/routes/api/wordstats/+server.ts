import { json, error } from '@sveltejs/kit';
import { native } from '$lib/server/native';
import { wordStatsJs } from '$lib/server/js-impl';
import type { RequestHandler } from './$types';

const TOP_N = 8;
const MAX_CHARS = 2_000_000;

export const POST: RequestHandler = async ({ request }) => {
	const { text } = await request.json();
	if (typeof text !== 'string' || !text.trim()) {
		error(400, 'text must be a non-empty string');
	}
	if (text.length > MAX_CHARS) {
		error(400, `text must be under ${MAX_CHARS} characters`);
	}

	let start = performance.now();
	const rust = native.wordStats(text, TOP_N);
	const rustMs = performance.now() - start;

	start = performance.now();
	const js = wordStatsJs(text, TOP_N);
	const jsMs = performance.now() - start;

	return json({
		rust: { ...rust, ms: rustMs },
		js: { ...js, ms: jsMs }
	});
};
