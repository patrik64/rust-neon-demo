import { createHash } from 'node:crypto';
import { json, error } from '@sveltejs/kit';
import { native } from '$lib/server/native';
import type { RequestHandler } from './$types';

const MAX_ROUNDS = 5_000_000;

function sha256NodeIterated(text: string, rounds: number): string {
	let digest: Buffer = createHash('sha256').update(text).digest();
	for (let i = 1; i < rounds; i++) {
		digest = createHash('sha256').update(digest).digest();
	}
	return digest.toString('hex');
}

export const POST: RequestHandler = async ({ request }) => {
	const { text, rounds } = await request.json();
	if (typeof text !== 'string' || !text) {
		error(400, 'text must be a non-empty string');
	}
	if (!Number.isInteger(rounds) || rounds < 1 || rounds > MAX_ROUNDS) {
		error(400, `rounds must be an integer between 1 and ${MAX_ROUNDS}`);
	}

	let start = performance.now();
	const rustHash = native.sha256(text, rounds);
	const rustMs = performance.now() - start;

	start = performance.now();
	const nodeHash = sha256NodeIterated(text, rounds);
	const nodeMs = performance.now() - start;

	return json({
		rounds,
		rust: { hash: rustHash, ms: rustMs },
		node: { hash: nodeHash, ms: nodeMs },
		match: rustHash === nodeHash
	});
};
