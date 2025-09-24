const cheerio = require('cheerio');
const needle = require('needle');

async function checkLive(channelID) {
	let yt_url;

	if (channelID.startsWith('@')) {
		yt_url = `https://www.youtube.com/${channelID}/live`;
	} else {
		yt_url = `https://www.youtube.com/channel/${channelID}/live`;
	}

	const response = {
		is_live: false,
		title: null,
		url: null,
	};

	try {
		const res = await needle('get', encodeURI(yt_url), { follow_max: 3 });
		const $ = cheerio.load(res.body);

		const canonical = $('link[rel="canonical"]').attr('href');
		const title = $('meta[name="title"]').attr('content');
		const isLiveBroadcast =
			$('meta[itemprop="isLiveBroadcast"]')?.attr('content')?.toLowerCase() === 'true';
		const startDate = $('meta[itemprop="startDate"]').attr('content');

		if (canonical?.startsWith('https://www.youtube.com/watch?v') && isLiveBroadcast) {
			const startTime = startDate ? new Date(startDate) : null;
			const now = new Date();

			if (startTime && startTime > now) {
				response.is_live = false;
				response.title = title;
				response.url = canonical;
			} else {
				response.is_live = true;
				response.title = title;
				response.url = canonical;
			}
		} else {
			response.is_live = false;
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
