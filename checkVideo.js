const { buildYouTubeURL } = require('./utils');

const needle = require('needle');

async function checkVideo(channelID) {
	const yt_url = buildYouTubeURL(channelID, 'videos');

	const response = {
		title: null,
		url: null,
		publishedTime: null,
		videoId: null,
	};

	try {
		const res = await needle('get', encodeURI(yt_url), { follow_max: 3 });

		const match = res.body.match(/var ytInitialData = (.*?);<\/script>/);
		if (!match) throw new Error('Could not find ytInitialData.');

		const data = JSON.parse(match[1]);
		const grid = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.find(
			(t) => t?.tabRenderer?.title === 'Videos',
		)?.tabRenderer?.content?.richGridRenderer?.contents;

		const firstVideo = grid?.find((item) => item.richItemRenderer?.content?.videoRenderer)
			?.richItemRenderer?.content?.videoRenderer;

		if (!firstVideo) throw new Error('No video found.');

		const videoId = firstVideo.videoId;
		const title = firstVideo.title?.runs?.[0]?.text;
		const publishedTime = firstVideo.publishedTimeText?.simpleText;

		response.title = title;
		response.url = `https://www.youtube.com/watch?v=${videoId}`;
		response.publishedTime = publishedTime;
		response.videoId = videoId;

		return response;
	} catch (error) {
		console.error('[YT VIDEO CHECK ERROR]', error.message);
		return {
			title: 'API ERROR',
			url: null,
			publishedTime: null,
			videoId: null,
		};
	}
}

module.exports = checkVideo;
