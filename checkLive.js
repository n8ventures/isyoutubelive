const { buildYouTubeURL } = require('./utils');

const cheerio = require('cheerio');
const needle = require('needle');

async function checkLive(channelID) {
	const yt_url = buildYouTubeURL(channelID, 'live');

	const response = {
		is_live: false,
		title: null,
		url: null,
	};

	try {
		// use a browser-like user agent and accept-language to get consistent HTML from YouTube
		const res = await needle('get', encodeURI(yt_url), {
			follow_max: 3,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept-Language': 'en-US,en;q=0.9',
			},
		});
		const $ = cheerio.load(res.body);

		let canonical = $('link[rel="canonical"]').attr('href');
		const title = $('meta[name="title"]').attr('content');
		let isLiveBroadcast =
			$('meta[itemprop="isLiveBroadcast"]')?.attr('content')?.toLowerCase() === 'true';
		const startDate = $('meta[itemprop="startDate"]').attr('content');

		// Fallback: some channel/id URLs return minimal/JS-driven HTML; inspect raw body for indicators
		if (!isLiveBroadcast && res.body) {
			const body = typeof res.body === 'string' ? res.body : res.body.toString('utf8');
			if (body.includes('"isLiveBroadcast":true') || /"isLive":\s*true/.test(body)) {
				isLiveBroadcast = true;
				// try to extract canonical/watch URL from raw HTML if cheerio didn't find it
				const canonicalMatch = body.match(
					/<link rel="canonical" href="(https:\/\/www\.youtube\.com\/watch\?v=[^"]+)"/,
				);
				if (canonicalMatch) canonical = canonicalMatch[1];
			}
		}

		if (canonical?.startsWith('https://www.youtube.com/watch?v') && isLiveBroadcast) {
			const startTime = startDate ? new Date(startDate) : null;
			const now = new Date();

			response.is_live = !startTime || startTime <= now;
			response.title = title;
			response.url = canonical;
		} else {
			response.title = title || 'Not live';
			response.url = canonical || null;
		}

		return response;
	} catch (error) {
		console.error('[YT CHECK ERROR]', error);
		return {
			is_live: false,
			title: 'API ERROR',
			url: null,
		};
	}
}

module.exports = checkLive;
