![npm](https://img.shields.io/npm/dt/%40n8ventures%2Fisyoutubelive?style=flat-square)
![npm version](https://img.shields.io/npm/v/%40n8ventures%2Fisyoutubelive?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/n8ventures/isyoutubelive?style=flat-square)
![npm bundle size](https://img.shields.io/bundlephobia/min/%40n8ventures%2Fisyoutubelive?style=flat-square)
![NPM License](https://img.shields.io/npm/l/%40n8ventures%2Fisyoutubelive?style=flat-square)

<p align="center">
  <h2 align="center">@n8ventures/isyoutubelive</h2>

Originally created by [Amith VP](https://github.com/amith-vp), maintained and extended by [N8VENTURES](https://github.com/n8ventures).

[![NPM](https://nodei.co/npm/@n8ventures/isyoutubelive.png?compact=true)](https://npmjs.org/package/@n8ventures/isyoutubelive)


NPM Module to check whether YouTube channel is live or not. WITHOUT YOUTUBE API KEY <br>
Return object with live status, video title, video url.

Now also returns latest YouTube channel upload with `checkVideo(channel)` and latest YouTube short with `checkShort(channel)`


## Installation

``` bash
npm i @n8ventures/isyoutubelive
```

## Usage


```js
const { checkLive, checkVideo, checkShort } = require("@n8ventures/isyoutubelive")

const channel = '@LinusTechTips'; // Can be Channel ID, @Handle, YT URLs

const liveData = await checkLive(channel);
console.log('Live Data:', liveData);

const videoData = await checkVideo(channel);
console.log('Latest Video:', videoData);

const shortData = await checkShort(channel);
console.log('Latest Short:', shortData);
```

Supported `channel` formats:

```js
'@LinusTechTips'
'UCXuqSBlHAE6Xw-yeJA0Tunw'
'https://www.youtube.com/@LinusTechTips'
'https://www.youtube.com/channel/UCXuqSBlHAE6Xw-yeJA0Tunw'
```

`checkLive()` returns 
```js
{
  is_live: boolean,
  is_upcoming: boolean,
  title: string,
  url: string | null,
  videoId: string | null,
  startTime: string | null,
} 
```

`checkVideo()` returns
```js 
{
  title: string,
  url: string,
  publishedTime: string,
  videoId: string,
  isMembersOnly: boolean,
  latestIsMembersOnly?: boolean,
  warning: string | null,
} 
```

`checkShort()` returns the same structure as `checkVideo()`
```js 
{
  title: string,
  url: string,
  publishedTime: string,
  videoId: string,
  isMembersOnly: boolean,
  latestIsMembersOnly?: boolean,
  warning: string | null,
} 
```

If you want the possibility of including Members Only videos/shorts, you can use `mode=false` meaning it should try to detect Members Only stuff. Due to how YouTube exposes channel data, detection of members-only uploads is not guaranteed in all cases.
```js
await checkVideo(channel, false);
await checkShort(channel, false);
```

`mode='membersOnly'` will only capture Members Only content. However this will not include the `latestIsMembersOnly` field.
```js
await checkVideo(channel, 'membersOnly');
await checkShort(channel, 'membersOnly');
```

More info below

### Members-only mode

When using:

```js
await checkVideo(channel, 'membersOnly');
```

or

```js
await checkShort(channel, 'membersOnly');
```

the returned object will not include:

```js
latestIsMembersOnly
```

because all returned results are already members-only content.

# Additional information

`warning` contains additional information when the package encounters limitations while detecting content. Otherwise it will be `null`.

`startTime` is an ISO 8601 timestamp and is only available for upcoming streams.

Example:

```js
{
  startTime: '2026-06-17T14:00:00.000Z'
}
```