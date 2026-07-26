const { buildYouTubeURL } = require('./utils');

const needle = require('needle');

function extractJsonAfter(body, marker) {
	const start = body.indexOf(marker);
	if (start === -1) return null;
	const jsonStart = start + marker.length;
	let depth = 0,
		inString = false,
		escape = false;
	for (let i = jsonStart; i < body.length; i++) {
		const ch = body[i];
		if (escape) {
			escape = false;
			continue;
		}
		if (ch === '\\') {
			escape = true;
			continue;
		}
		if (ch === '"') {
			inString = !inString;
			continue;
		}
		if (inString) continue;
		if (ch === '{') depth++;
		else if (ch === '}') {
			depth--;
			if (depth === 0) return body.slice(jsonStart, i + 1);
		}
	}
	return null;
}

async function checkLive(channelID) {
	const yt_url = buildYouTubeURL(channelID, 'live');

	const response = {
		is_live: false,
		is_upcoming: false,
		title: null,
		url: null,
		videoId: null,
		startTime: null,
	};

	try {
		const res = await needle('get', encodeURI(yt_url), {
			follow_max: 3,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept-Language': 'en-US,en;q=0.9',
			},
		});
		const body = typeof res.body === 'string' ? res.body : res.body.toString('utf8');

		const playerJson = extractJsonAfter(body, 'var ytInitialPlayerResponse = ');
		if (playerJson) {
			const player = JSON.parse(playerJson);
			const vd = player.videoDetails;

			if (vd?.isLive === true) {
				response.is_live = true;
				response.title = vd.title ?? null;
				response.videoId = vd.videoId ?? null;
				response.url = vd.videoId ? `https://www.youtube.com/watch?v=${vd.videoId}` : null;
				return response;
			}

			if (vd?.isUpcoming === true) {
				const offlineSlate =
					player.playabilityStatus?.liveStreamability?.liveStreamabilityRenderer
						?.offlineSlate?.liveStreamOfflineSlateRenderer;
				const scheduledStartTime = offlineSlate?.scheduledStartTime
					? parseInt(offlineSlate.scheduledStartTime, 10) * 1000
					: null;

				const isFuture = scheduledStartTime ? scheduledStartTime > Date.now() : false;

				if (isFuture) {
					response.is_upcoming = true;
					response.title = vd.title ?? null;
					response.videoId = vd.videoId ?? null;
					response.url = vd.videoId
						? `https://www.youtube.com/watch?v=${vd.videoId}`
						: null;
					response.startTime = new Date(scheduledStartTime).toISOString();
					return response;
				}
				// scheduledStartTime is in the past (or missing) - stale/never-started
				// premiere; fall through to "not live"
			}

			response.title = 'Not live';
			return response;
		}

		// No ytInitialPlayerResponse: most likely redirected to the channel's
		// regular page because there's no active/scheduled live stream.
		const canonicalMatch = body.match(/<link rel="canonical" href="([^"]+)"/);
		const canonical = canonicalMatch?.[1] ?? null;

		const titleMatch = body.match(/<meta name="title" content="([^"]*)"/);
		const title = titleMatch?.[1] ?? null;

		const isLiveBroadcast = /<meta itemprop="isLiveBroadcast" content="true"/.test(body);

		if (canonical?.startsWith('https://www.youtube.com/watch?v') && isLiveBroadcast) {
			const videoIdMatch = canonical.match(/[?&]v=([^&]+)/);
			response.is_live = true;
			response.title = title;
			response.url = canonical;
			response.videoId = videoIdMatch ? videoIdMatch[1] : null;
			return response;
		}

		response.title = title || 'Not live';
		response.url = canonical;
		return response;
	} catch (error) {
		console.error('[YT CHECK ERROR]', error);
		return {
			is_live: false,
			is_upcoming: false,
			title: 'API ERROR',
			url: null,
			videoId: null,
			startTime: null,
		};
	}
}

module.exports = checkLive;
