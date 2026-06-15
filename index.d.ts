export interface LiveData {
  is_live: boolean;
  is_upcoming: boolean;
  title: string | null;
  url: string | null;
  videoId: string | null;
  startTime: string | null;
}

export interface VideoData {
  title: string;
  url: string;
  publishedTime: string;
  videoId: string;
  isMembersOnly: boolean;
  latestIsMembersOnly?: boolean;
  warning: string | null;
}

export type ShortData = VideoData;
export type CheckMode = boolean | 'membersOnly';


/**
 * Check if a YouTube channel is currently live.
 * @param channelID - YouTube channel handle (e.g. `'@LinusTechTips'`) or ID (e.g. `'UCXuqSBlHAE6Xw-yeJA0Tunw'`).
 * @returns Information about the current live stream.
 */
export function checkLive(channelID: string): Promise<LiveData>;

/**
 * Get the latest uploaded video from a YouTube channel.
 * @param channelID - YouTube channel handle (e.g. `'@LinusTechTips'`) or ID (e.g. `'UCXuqSBlHAE6Xw-yeJA0Tunw'`).
 * @param mode - Search mode. Defaults to `true`, which returns the latest public video only. Use `false` to return the latest video regardless of whether it is public or members-only. Use `'membersOnly'` to return the latest members-only video.
 * @returns Information about the latest video.
 */
export function checkVideo(
  channelID: string,
  mode?: CheckMode
): Promise<VideoData>;

/**
 * Get the latest short from a YouTube channel.
 * @param channelID - YouTube channel handle (e.g. `'@LinusTechTips'`) or ID (e.g. `'UCXuqSBlHAE6Xw-yeJA0Tunw'`).
 * @param mode - Search mode. Defaults to `true`, which returns the latest public short only. Use `false` to return the latest short regardless of whether it is public or members-only. Use `'membersOnly'` to return the latest members-only short.
 * @returns Information about the latest short.
 */
export function checkShort(
  channelID: string,
  mode?: CheckMode
): Promise<ShortData>;