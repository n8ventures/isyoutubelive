function buildYouTubeURL(channelID, type = 'videos') {
	channelID = channelID.trim();
	const base = 'https://www.youtube.com';

	if (channelID.startsWith('youtube.com') || channelID.startsWith('www.youtube.com')) {
		channelID = `https://${channelID}`;
	}

	if (channelID.startsWith('http')) {
		try {
			const url = new URL(channelID);
			let path = url.pathname.replace(/\/+$/, '');

			if (!path.startsWith('/')) path = `/${path}`;
			return `${base}${path}/${type}`;
		} catch (err) {
			console.warn('[buildYouTubeURL] Invalid URL:', err);
		}
	}

	if (channelID.startsWith('@')) {
		return `${base}/${channelID}/${type}`;
	}

	return `${base}/channel/${channelID}/${type}`;
}

function isMembersOnly(video) {
	if (!video) return false;
	const hasMembersBadge = (video.badges ?? []).some(
		(b) =>
			b.metadataBadgeRenderer?.style === 'BADGE_MEMBERS_ONLY' ||
			b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_MEMBERS_ONLY' ||
			b.metadataBadgeRenderer?.label === 'Members only',
	);
	return hasMembersBadge;
}

function parseYouTubeDate(text) {
	if (!text || typeof text !== 'string') return null;

	// Absolute format (shorts watch page)
	const absMatch = text.match(/([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})/);
	if (absMatch) {
		const d = new Date(absMatch[1]);
		if (!isNaN(d.getTime())) return d;
	}

	const patterns = [
		{ unit: 'year', regex: /(\d+)\s*(?:years?|yrs?|y)\s*ago/i },
		{ unit: 'month', regex: /(\d+)\s*(?:months?|mos?)\s*ago/i },
		{ unit: 'week', regex: /(\d+)\s*(?:weeks?|wks?|w)\s*ago/i },
		{ unit: 'day', regex: /(\d+)\s*(?:days?|d)\s*ago/i },
		{ unit: 'hour', regex: /(\d+)\s*(?:hours?|hrs?|h)\s*ago/i },
		{ unit: 'minute', regex: /(\d+)\s*(?:minutes?|mins?|m)\s*ago/i },
		{ unit: 'second', regex: /(\d+)\s*(?:seconds?|secs?|s)\s*ago/i },
	];

	const msPerUnit = {
		second: 1000,
		minute: 60 * 1000,
		hour: 60 * 60 * 1000,
		day: 24 * 60 * 60 * 1000,
		week: 7 * 24 * 60 * 60 * 1000,
		month: 30 * 24 * 60 * 60 * 1000,
		year: 365 * 24 * 60 * 60 * 1000,
	};

	for (const { unit, regex } of patterns) {
		const match = text.match(regex);
		if (match) {
			return new Date(Date.now() - parseInt(match[1], 10) * msPerUnit[unit]);
		}
	}

	return null;
}

function pickMostRecent(items) {
	let best = null;
	for (const item of items) {
		if (!best) {
			best = item;
			continue;
		}
		if (
			item._parsedDate &&
			(!best._parsedDate || item._parsedDate.getTime() > best._parsedDate.getTime())
		) {
			best = item;
		}
	}
	return best;
}

module.exports = {
	buildYouTubeURL,
	isMembersOnly,
	parseYouTubeDate,
	pickMostRecent,
};
