export interface LiveData {
  is_live: boolean;
  title: string | null;
  url: string | null;
}

export interface VideoData {
  title: string;
  url: string;
  publishedTime: string;
  videoId: string;
  isMembersOnly: boolean;
  latestIsMembersOnly: boolean;
  warning: string | null;
}

export type ShortData = VideoData;
export type CheckMode = boolean | 'membersOnly';


/**
 * Check if a YouTube channel is currently live.
 * @param channelID - YouTube channel handle (e.g. '@LinusTechTips') or ID.
 */
export function checkLive(channelID: string): Promise<LiveData>;

/**
 * Get the latest uploaded video from a YouTube channel.
 * @param channelID - YouTube channel handle (e.g. '@LinusTechTips') or ID.
 * @param mode - Whether to include members-only videos in the search. Defaults to true, meaning it will only detect public videos. Use 'membersOnly' if you want Members Only Videos.
 */
export function checkVideo(
  channelID: string,
  mode?: CheckMode
): Promise<VideoData>;

/**
 * Get the latest short from a YouTube channel.
 * @param channelID - YouTube channel handle (e.g. '@LinusTechTips') or ID.
 * @param mode - Whether to include members-only shorts in the search. Defaults to true, meaning it will only detect public shorts. Use 'membersOnly' if you want Members Only Shorts.
 */
export function checkShort(channelID: string, mode?: CheckMode): Promise<ShortData>;
