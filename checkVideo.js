const { buildYouTubeURL, isMembersOnly } = require('./utils');

const needle = require('needle');

async function checkVideo(channelID, mode = true) {
	const yt_url = buildYouTubeURL(channelID, 'videos');

	let response = {
		title: null,
		url: null,
		publishedTime: null,
		videoId: null,
		isMembersOnly: false,
		latestIsMembersOnly: false,
		warning: null,
	};

	function normalizeLockupVideo(lockup) {
		if (!lockup || lockup.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO') return null;

		const meta = lockup.metadata?.lockupMetadataViewModel;
		const videoId = lockup.contentId;
		const title = meta?.title?.content ?? null;

		const metadataRows = meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [];

		let publishedTime = null;
		const badges = [];

		for (const row of metadataRows) {
			// "X ago" / view count text
			for (const part of row.metadataParts ?? []) {
				if (part.text?.content && /ago$/.test(part.text.content)) {
					publishedTime = part.text.content;
				}
			}
			// Members-only / other badges live in their own row
			for (const b of row.badges ?? []) {
				const vm = b.badgeViewModel;
				if (vm) {
					badges.push({
						metadataBadgeRenderer: {
							style: vm.badgeStyle,
							label: vm.badgeText,
						},
					});
				}
			}
		}

		return {
			videoId,
			title: { runs: [{ text: title }] },
			publishedTimeText: publishedTime ? { simpleText: publishedTime } : null,
			badges,
		};
	}

	try {
		const res = await needle('get', encodeURI(yt_url), { follow_max: 3 });
		const match = res.body.match(/var ytInitialData = (.*?);<\/script>/s);
		if (!match) throw new Error('Could not find ytInitialData.');

		const data = JSON.parse(match[1]);
		const grid = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.find(
			(t) => t?.tabRenderer?.title === 'Videos',
		)?.tabRenderer?.content?.richGridRenderer?.contents;

		const videos = (grid || [])
			.map((item) => normalizeLockupVideo(item?.richItemRenderer?.content?.lockupViewModel))
			.filter(Boolean);

		const latest = videos[0];
		const latestIsMembersOnly = isMembersOnly(latest);

		// normalize legacy boolean usage
		const resolvedMode = mode === true ? 'public' : mode === false ? 'all' : mode;

		let chosenVideo = null;

		if (resolvedMode === 'public') {
			chosenVideo = videos.find((video) => !isMembersOnly(video)) || null;
			if (!chosenVideo) return response;
		} else if (resolvedMode === 'membersOnly') {
			chosenVideo = videos.find((video) => isMembersOnly(video)) || null;
			const { latestIsMembersOnly, ...clean } = response;
			response = clean;
			if (!chosenVideo) {
				response.warning = 'No members-only video found in the recent uploads.';
				return response;
			}
		} else {
			// 'all' — original public === false behavior
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
