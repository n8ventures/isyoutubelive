const { checkVideoDebug } = require('./index');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatTimestamp() {
	const d = new Date();

	const pad = (n) => String(n).padStart(2, '0');

	const DD = pad(d.getDate());
	const MM = pad(d.getMonth() + 1);
	const YY = String(d.getFullYear()).slice(-2);
	const HH = pad(d.getHours());
	const MI = pad(d.getMinutes());
	const SS = pad(d.getSeconds());

	return `${DD}${MM}${YY}_${HH}-${MI}-${SS}`;
}

function saveScan(channelID, scan) {
	if (!scan) return;

	const dir = path.join(__dirname, 'yt_scans', channelID);
	fs.mkdirSync(dir, { recursive: true });

	const file = path.join(dir, `${formatTimestamp()}.json`);
	fs.writeFileSync(file, JSON.stringify(scan, null, 2));
}

// This debug script continuously polls a YouTube channel's videos page
// and logs when a new video is detected compared to the last known video.
// It saves detailed scan data to JSON files for further analysis.

// I'm putting this up in the repo for easy access while debugging video detection issues.
// At the moment, there are rare cases that Members-Only videos are being detected as public.

(async () => {
	const channelID = '@LinusTechTips'; // Change to desired channel ID
	const POLL_INTERVAL_MS = 7000;

	let lastVideoId = null;

	while (true) {
		try {
			const { response: videoData, scan } = await checkVideoDebug(channelID, true);

			if (!videoData?.videoId) {
				//console.warn('No videoId returned, retrying...');
			} else if (!lastVideoId) {
				console.log('Poll:', POLL_INTERVAL_MS, 'ms');

				saveScan(channelID, scan);

				lastVideoId = videoData.videoId;

				console.log('Baseline videoId:', lastVideoId);
				console.log('Timestamp: ', formatTimestamp());
			} else if (videoData.videoId !== lastVideoId) {
				saveScan(channelID, scan);
				console.log('Video changed!');
				console.log('Timestamp: ', formatTimestamp());
				console.log('Previous:', lastVideoId);
				console.log('Current:', videoData);
				break;
			} else {
				// console.log('No change:', videoData.videoId);
			}
		} catch (err) {
			console.error('Polling error:', err.message);
		}

		await sleep(POLL_INTERVAL_MS);
	}
})();
