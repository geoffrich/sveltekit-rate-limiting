import type { Actions } from './$types';
import { building } from '$app/environment';

import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from '$env/static/private';
import { fail } from '@sveltejs/kit';

let redis: Redis;
let ratelimit: Ratelimit;

// should make sure this is shut off during prerendering
if (!building) {
	redis = new Redis({
		url: UPSTASH_REDIS_REST_URL,
		token: UPSTASH_REDIS_REST_TOKEN
	});

	ratelimit = new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(5, '10 s')
	});
}

export const actions: Actions = {
	default: async (event) => {
		const ip = event.getClientAddress();
		const rateLimitAttempt = await ratelimit.limit(ip);
		if (!rateLimitAttempt.success) {
			const timeRemaining = Math.floor((rateLimitAttempt.reset - new Date().getTime()) / 1000);
			return fail(429, {
				error: `Too many requests. Please try again in ${timeRemaining} seconds.`
			});
		}

		const data = await event.request.formData();
		const text = (data.get('text') as string) ?? '';
		const result = performExpensiveOperation(text);
		return {
			original: text,
			result
		};
	}
};

const wordSeparators = /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/;
const capitals = /[A-Z\u00C0-\u00D6\u00D9-\u00DD]/g;

// credit to https://github.com/angus-c/just/blob/master/packages/string-snake-case/index.mjs
function performExpensiveOperation(text: string) {
	text = text.replace(capitals, function (match) {
		return ' ' + (match.toLowerCase() || match);
	});
	return text.trim().split(wordSeparators).join('_');
}
