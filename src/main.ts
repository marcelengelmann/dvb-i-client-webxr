import dashjs from "dashjs";
import { DVBIClient } from "./dvb-i-client/dvb-i-client";

AFRAME.registerComponent("video-handler", {
	init: function () {
		this.onKeyUp = this.onKeyUp.bind(this);
		//this.el.addEventListener("click", this.onKeyUp);
	},
	onKeyUp: function () {
		var videoEl = this.el.getAttribute("material").src;
		if (!videoEl) {
			return;
		}
		if (videoEl.paused) {
			videoEl.play();
		} else {
			videoEl.pause();
		}
	},
});

const dvbIClient = new DVBIClient(
	"https://dvb-i.net/production/services.php/de"
);

let channelIndex = 0;
const defaultChannels = await dvbIClient.getDefaultChannels();
const testStreamUrl = defaultChannels[channelIndex].channel.dashStreamUrl;
channelIndex++;

const dashPlayer = dashjs.MediaPlayer().create();
dashPlayer.initialize(
	document.querySelector("#test-video") as unknown as HTMLMediaElement,
	testStreamUrl,
	true
);

(window as any).nexVideo = () => {
	if (channelIndex === defaultChannels.length) {
		channelIndex = 0;
	}
	const nextStreamUrl = defaultChannels[channelIndex].channel.dashStreamUrl;
	channelIndex++;
	if (nextStreamUrl === undefined) {
		console.error(
			"Could not find a stream for the channel ",
			defaultChannels[channelIndex].channel.name
		);
		(window as any).nextVideo();
		return;
	}
	dashPlayer.attachSource(nextStreamUrl);
};

export {};
