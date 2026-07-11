const { buildYouTubeURL, parseYouTubeDate, pickMostRecent } = require('./utils');
const needle = require('needle');

async function getShortPublishedTime(videoId) {
	try {
		const url = `https://www.youtube.com/watch?v=${videoId}`;
		const res = await needle('get', url, { follow_max: 3 });
		const match = res.body.match(/var ytInitialData = (.*?);<\/script>/s);
		if (!match) return null;

		const data = JSON.parse(match[1]);

		const contents =
			data.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
		const videoPrimaryInfo = contents.find(
			(c) => c?.videoPrimaryInfoRenderer,
		)?.videoPrimaryInfoRenderer;

		if (!videoPrimaryInfo) return null;

		return (
			videoPrimaryInfo.dateText?.simpleText ||
			videoPrimaryInfo.dateText?.runs?.[0]?.text ||
			null
		);
	} catch (error) {
		console.error('[YT SHORT TIME ERROR]', error.message);
		return null;
	}
}

function isShortMembersOnly(reel) {
	const secondaryText = reel?.overlayMetadata?.secondaryText?.content ?? '';
	return /members only/i.test(secondaryText);
}

function normalizeShort(item) {
	const vm = item?.richItemRenderer?.content?.shortsLockupViewModel;
	if (!vm) return null;
	return {
		videoId: vm.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId,
		title: vm.overlayMetadata?.primaryText,
		overlayMetadata: vm.overlayMetadata,
		accessibilityText: vm.accessibilityText,
	};
}

// How many top-of-grid candidates to actually verify by fetching a real
// date. Higher = more accurate, but more requests per check.
const CANDIDATE_POOL_SIZE = 4;

async function resolveMostRecent(candidates) {
	const pool = candidates.slice(0, CANDIDATE_POOL_SIZE);

	const withDates = await Promise.all(
		pool.map(async (reel) => ({
			...reel,
			_publishedTime: await getShortPublishedTime(reel.videoId),
		})),
	);

	const withParsedDates = withDates.map((r) => ({
		...r,
		_parsedDate: parseYouTubeDate(r._publishedTime),
	}));

	return pickMostRecent(withParsedDates) || candidates[0] || null;
}

async function checkShort(channelID, mode = true) {
	const yt_url = buildYouTubeURL(channelID, 'shorts');
	let response = {
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
		const match = res.body.match(/var ytInitialData = (.*?);<\/script>/s);
		if (!match) throw new Error('Could not find ytInitialData.');

		const data = JSON.parse(match[1]);

		const grid = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.find(
			(t) => t?.tabRenderer?.title === 'Shorts',
		)?.tabRenderer?.content?.richGridRenderer?.contents;

		const reels = (grid || []).map(normalizeShort).filter(Boolean);
		const resolvedMode = mode === true ? 'public' : mode === false ? 'all' : mode;

		let chosenReel = null;

		if (resolvedMode === 'public') {
			const publicReels = reels.filter((r) => !isShortMembersOnly(r));
			if (!publicReels.length) return response;
			chosenReel = await resolveMostRecent(publicReels);
		} else if (resolvedMode === 'membersOnly') {
			const membersReels = reels.filter((r) => isShortMembersOnly(r));
			const { latestIsMembersOnly, ...clean } = response;
			response = clean;
			if (!membersReels.length) {
				response.warning = 'No members-only short found in the recent uploads.';
				return response;
			}
			chosenReel = await resolveMostRecent(membersReels);
		} else {
			chosenReel = await resolveMostRecent(reels);
			const latestIsMembersOnly = isShortMembersOnly(reels[0]);
			response.latestIsMembersOnly = Boolean(latestIsMembersOnly);
			if (latestIsMembersOnly) {
				response.warning =
					'The latest short is marked members-only. When allowing members-only results, YouTube page data may still expose limited info; the returned item may be members-only.';
			}
		}

		if (!chosenReel) throw new Error('No short found.');

		const videoId = chosenReel.videoId;
		const title = chosenReel.title?.content || null;

		response.title = title;
		response.url = `https://www.youtube.com/watch?v=${videoId}`;
		response.videoId = videoId;
		response.isMembersOnly = isShortMembersOnly(chosenReel);
		response.publishedTime =
			chosenReel._publishedTime ?? (await getShortPublishedTime(videoId));

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
