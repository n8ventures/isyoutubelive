function buildYouTubeURL(channelID, type = 'videos') {
	channelID = channelID.trim();
	const base = 'https://www.youtube.com';

	if (channelID.startsWith('youtube.com') || channelID.startsWith('www.youtube.com')) {
		channelID = `https://${channelID}`;
	}

	// Full YouTube URL
	if (channelID.startsWith('http')) {
		try {
			const url = new URL(channelID);
			let path = url.pathname.replace(/\/+$/, '');

			if (!path.startsWith('/')) path = `/${path}`;

			if (path.startsWith('/@') || path.startsWith('/channel/')) {
				return `${base}${path}/${type}`;
			}

			return `${base}${path}/${type}`;
		} catch (err) {
			console.warn('[buildYouTubeURL] Invalid URL:', err);
		}
	}

	// YouTube Handle
	if (channelID.startsWith('@')) {
		return `${base}/${channelID}/${type}`;
	}

	// YouTube Channel ID (default)
	return `${base}/channel/${channelID}/${type}`;
}

module.exports = { buildYouTubeURL };
