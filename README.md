![npm](https://img.shields.io/npm/dt/%40n8ventures%2Fisyoutubelive?style=flat-square)
![npm version](https://img.shields.io/npm/v/%40n8ventures%2Fisyoutubelive?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/n8ventures/isyoutubelive?style=flat-square)
![npm bundle size](https://img.shields.io/bundlephobia/min/%40n8ventures%2Fisyoutubelive?style=flat-square)
![NPM License](https://img.shields.io/npm/l/%40n8ventures%2Fisyoutubelive?style=flat-square)

<p align="center">
  <h2 align="center">@n8ventures/isyoutubelive</h2>

Originally created by [Amith VP](https://github.com/amith-vp), maintained and extended by [N8VENTURES](https://github.com/n8ventures).

[![NPM](https://nodei.co/npm/@n8ventures/isyoutubelive.png?compact=true)](https://npmjs.org/package/@n8ventures/isyoutubelive)


NPM Module to check whether YouTube channel is live or not . WITHOUT YOUTUBE API KEY <br>
Return object with live status, video title, video url.

Now also returns latest YouTube channel upload with `checkVideo(channelID)`


## :floppy_disk: Installation

``` bash
npm i @n8ventures/isyoutubelive
```

## :feet: Usage

```js
const { checkLive, checkVideo } = require("@n8ventures/isyoutubelive")

const channelID = '@LinusTechTips'; // Can be Channel ID, @Handle, YT URLs

const liveData = await checkLive(channelID);
console.log('Live Data:', liveData);

const videoData = await checkVideo(channelID);
console.log('Latest Video:', videoData);
```

`checkLive()` returns 
```js
{
  is_live: boolean,
  title: string || 'Not live'
  url: string
} 
```

`checkVideo()` returns
```js 
{
  title: string,
  url: string,
  publishedTime: string,
  videoId: string
} 
```
