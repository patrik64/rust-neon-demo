import { json } from '@sveltejs/kit';
import { native } from '$lib/server/native';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const name = url.searchParams.get('name')?.trim() || 'stranger';
	return json({ message: native.greet(name) });
};
