const { buildYouTubeURL } = require('./utils');
const needle = require('needle');

// debugging
function extractVideoRenderers(grid) {
	return grid
		.map((item, index) => {
			const v = item?.richItemRenderer?.content?.videoRenderer;
			if (!v) return null;

			return { index, raw: v };
		})
		.filter(Boolean);
}

function introspectVideo(v) {
	return {
		videoId: v.videoId ?? null,

		title: v.title?.runs?.map((r) => r.text).join('') ?? null,

		publishedTimeText: v.publishedTimeText ?? null,

		badges: (v.badges ?? []).map((b) => ({
			label: b.metadataBadgeRenderer?.label ?? null,
			style: b.metadataBadgeRenderer?.style ?? null,
		})),

		thumbnailOverlayStyles: (v.thumbnailOverlays ?? [])
			.map((o) => o.thumbnailOverlayTimeStatusRenderer?.style)
			.filter(Boolean),

		accessibilityLabel: v.accessibility?.accessibilityData?.label ?? null,

		ownerBadges: v.ownerBadges ?? null,

		menuItems:
			v.menu?.menuRenderer?.items
				?.map((i) => i.menuServiceItemRenderer?.text?.runs?.[0]?.text)
				.filter(Boolean) ?? [],

		navigationEndpoint: v.navigationEndpoint?.watchEndpoint ?? null,

		raw: v ?? null,
	};
}

async function checkVideo(channelID, debug = false) {
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

		let scan = null;
		if (debug) {
			const extracted = extractVideoRenderers(grid);

			scan = {
				scannedAt: new Date().toISOString(),
				channelID,
				totalItems: grid.length,
				videoCount: extracted.length,
				videos: extracted.map(({ index, raw }) => ({
					index,
					...introspectVideo(raw),
					isMembersOnly:
						(raw?.badges ?? []).some(
							(b) => b.metadataBadgeRenderer?.label === 'Members only',
						) ||
						(raw?.thumbnailOverlays ?? []).some(
							(o) => o.thumbnailOverlayTimeStatusRenderer?.style === 'MEMBERS_ONLY',
						) ||
						raw?.publishedTimeText == null,
				})),
			};

			return { response, scan };
		}

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
