![npm](https://img.shields.io/npm/dt/isyoutubelive?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/n8ventures/isyoutubelive?style=flat-square)
![npm](https://img.shields.io/npm/v/isyoutubelive?style=flat-square) 
![npm bundle size](https://img.shields.io/bundlephobia/min/isyoutubelive?style=flat-square)
![NPM](https://img.shields.io/npm/l/isyoutubelive?style=flat-square)

<p align="center">
  <h2 align="center">@n8ventures/isyoutubelive</h2>

Originally created by [Amith VP](https://github.com/amith-vp), maintained and extended by [N8VENTURES](https://github.com/n8ventures).

[![NPM](https://nodei.co/npm/isyoutubelive.png?compact=true)](https://npmjs.org/package/isyoutubelive)


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

const channelID = '@LinusTechTips'; 

const liveData = await checkLive(channelID);
console.log('Live Data:', liveData);

const videoData = await checkVideo(channelID);
console.log('Latest Video:', videoData);
```

checkLive() returns 
{
  is_live: boolean,
  title: string || 'Not live'
  url: string
} 

checkVideo() returns 
{
  title: string,
  url: string,
  publishedTime: string,
  videoId: string
} 

