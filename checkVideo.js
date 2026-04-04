const { buildYouTubeURL, isMembersOnly } = require('./utils');

const needle = require('needle');

async function checkVideo(channelID, public = true) {
	const yt_url = buildYouTubeURL(channelID, 'videos');

	const response = {
		title: null,
		url: null,
		publishedTime: null,
		videoId: null,
		isMembersOnly: false,
		latestIsMembersOnly: false,
		warning: null,
	};

	try {
		const res = await needle('get', encodeURI(yt_url), { follow_max: 3 });

		const match = res.body.match(/var ytInitialData = (.*?);<\/script>/);
		if (!match) throw new Error('Could not find ytInitialData.');

		const data = JSON.parse(match[1]);
		const grid = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.find(
			(t) => t?.tabRenderer?.title === 'Videos',
		)?.tabRenderer?.content?.richGridRenderer?.contents;

		const videos = (grid || [])
			.map((item) => item?.richItemRenderer?.content?.videoRenderer)
			.filter(Boolean);

		const latest = videos[0];
		const latestIsMembersOnly = isMembersOnly(latest);

		let chosenVideo = null;

		if (public === true) {
			chosenVideo = videos.find((video) => !isMembersOnly(video)) || null;
			if (!chosenVideo) {
				return response;
			}
		} else {
			chosenVideo = latest;
			response.latestIsMembersOnly = Boolean(latestIsMembersOnly);
			if (latestIsMembersOnly) {
				response.warning =
					'The latest video is marked members-only. When allowing members-only results, YouTube page data may still expose limited info; the returned item may be members-only.';
			}
		}

		if (!chosenVideo) throw new Error('No video found.');

		const videoId = chosenVideo.videoId;
		const title = chosenVideo.title?.runs?.[0]?.text ?? null;
		const publishedTime = chosenVideo.publishedTimeText?.simpleText ?? null;

		response.title = title;
		response.url = `https://www.youtube.com/watch?v=${videoId}`;
		response.publishedTime = publishedTime;
		response.videoId = videoId;
		response.isMembersOnly = isMembersOnly(chosenVideo);

		return response;
	} catch (error) {
		console.error('[YT VIDEO CHECK ERROR]', error.message);
		return {
			title: 'API ERROR',
			url: null,
			publishedTime: null,
			videoId: null,
			isMembersOnly: false,
			latestIsMembersOnly: false,
			warning: null,
		};
	}
}

module.exports = checkVideo;
