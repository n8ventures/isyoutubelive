const { buildYouTubeURL, isMembersOnly } = require('./utils');

const needle = require('needle');

async function getShortPublishedTime(videoId) {
	try {
		const url = `https://www.youtube.com/watch?v=${videoId}`;
		const res = await needle('get', url, { follow_max: 3 });

		const match = res.body.match(/var ytInitialData = (.*?);<\/script>/);
		if (!match) return null;

		const data = JSON.parse(match[1]);

		const contents =
			data.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
		const videoPrimaryInfo = contents.find(
			(c) => c?.videoPrimaryInfoRenderer,
		)?.videoPrimaryInfoRenderer;

		if (!videoPrimaryInfo) return null;

		const publishedTimeText =
			videoPrimaryInfo.dateText?.simpleText ||
			videoPrimaryInfo.dateText?.runs?.[0]?.text ||
			null;

		return publishedTimeText;
	} catch (error) {
		console.error('[YT SHORT TIME ERROR]', error.message);
		return null;
	}
}

async function checkShort(channelID, public = true) {
	const yt_url = buildYouTubeURL(channelID, 'shorts');

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
			(t) => t?.tabRenderer?.title === 'Shorts',
		)?.tabRenderer?.content?.richGridRenderer?.contents;

		const reels = (grid || [])
			.map((item) => {
				const vm = item?.richItemRenderer?.content?.shortsLockupViewModel;
				if (!vm) return null;
				return {
					videoId: vm.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId,
					title: vm.overlayMetadata?.primaryText,
					accessibilityText: vm.accessibilityText,
				};
			})
			.filter(Boolean);

		const latest = reels[0];

		let chosenReel = null;

		if (public === true) {
			chosenReel = reels[0] || null;
			if (!chosenReel) {
				return response;
			}
		} else {
			chosenReel = latest;
		}

		if (!chosenReel) throw new Error('No short found.');

		const videoId = chosenReel.videoId;
		const title = chosenReel.title?.content || null;

		response.title = title;
		response.url = `https://www.youtube.com/watch?v=${videoId}`;
		response.videoId = videoId;
		response.isMembersOnly = false;

		const publishedTime = await getShortPublishedTime(videoId);
		response.publishedTime = publishedTime;

		return response;
	} catch (error) {
		console.error('[YT SHORTS CHECK ERROR]', error.message);
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

module.exports = checkShort;
