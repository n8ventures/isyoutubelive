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
}

/**
 * Check if a YouTube channel is currently live.
 * @param channelID - YouTube channel handle (e.g. '@LinusTechTips') or ID.
 */
export function checkLive(channelID: string): Promise<LiveData>;

/**
 * Get the latest uploaded video from a YouTube channel.
 * @param channelID - YouTube channel handle (e.g. '@LinusTechTips') or ID.
 */
export function checkVideo(channelID: string): Promise<VideoData>;
