import { json, error } from '@sveltejs/kit';
import { native } from '$lib/server/native';
import { countPrimesJs } from '$lib/server/js-impl';
import type { RequestHandler } from './$types';

const MAX_LIMIT = 50_000_000;

export const POST: RequestHandler = async ({ request }) => {
	const { limit } = await request.json();
	if (!Number.isInteger(limit) || limit < 2 || limit > MAX_LIMIT) {
		error(400, `limit must be an integer between 2 and ${MAX_LIMIT}`);
	}

	let start = performance.now();
	const jsCount = countPrimesJs(limit);
	const jsMs = performance.now() - start;

	start = performance.now();
	const rustCount = native.countPrimes(limit);
	const rustMs = performance.now() - start;

	start = performance.now();
	const rustAsyncCount = await native.countPrimesAsync(limit);
	const rustAsyncMs = performance.now() - start;

	return json({
		limit,
		js: { count: jsCount, ms: jsMs },
		rust: { count: rustCount, ms: rustMs },
		rustAsync: { count: rustAsyncCount, ms: rustAsyncMs }
	});
};
