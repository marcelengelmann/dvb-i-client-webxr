import dashjs from "dashjs";
import { DVBIClient } from "../../dvb-i-client/dvb-i-client";
import loadingVideo from "./loading/loading.mp4";

const dvbiClient = new DVBIClient(
	"https://dvb-i.net/production/services.php/de"
);

AFRAME.registerPrimitive("a-dvbi-player", {
	defaultComponents: {
		"dvbi-player": {},
		position: { x: 0, y: 0, z: -8 },
	},
	mappings: {
		width: "dvbi-player.width",
		height: "dvbi-player.height",
		muted: "dvbi-player.muted",
	},
});

AFRAME.registerComponent("dvbi-player", {
	schema: {
		width: { type: "int", default: 16, min: 0 },
		height: { type: "int", default: 9, min: 0 },
		muted: { type: "boolean", default: false },
	},
	init: async function () {
		this.defaultChannels = await dvbiClient.getDefaultChannels();
		this.currentChannelIndex = 0;
		this.lastChannelDifference = 1;
		this.createDashVideo(this.data.muted);
		this.dashPlayer.on("error", (e) => {
			console.error(e);
			//this.startNewStream(this.lastChannelDifference);
		});

		this.dashPlayer.on("canPlay", () => {
			this.aVideo.setAttribute("src", "#" + this.videoElement.id);
		});

		this.loadingVideoElement = document.createElement(
			"video"
		) as unknown as HTMLVideoElement;
		this.loadingVideoElement.id = "loadingVideo";
		this.loadingVideoElement.src = loadingVideo;
		this.loadingVideoElement.loop = true;
		this.el.appendChild(this.loadingVideoElement);
		this.loadingVideoElement.play();

		// add the video as a reference for the a-video primitive
		this.el.appendChild(this.videoElement);

		// create  the a-video primitive
		this.aVideo = document.createElement("a-video");
		this.aVideo.setAttribute("width", this.data.width);
		this.aVideo.setAttribute("height", this.data.height);
		this.aVideo.setAttribute("src", "#" + this.loadingVideoElement.id);

		this.el.appendChild(this.aVideo);

		// create the video controls
		const videoControls = document.createElement("a-dvbi-player-controls");
		videoControls.addEventListener("nextChannel", () => this.startNewStream(1));
		videoControls.addEventListener("previousChannel", () =>
			this.startNewStream(-1)
		);
		videoControls.addEventListener("videoIsPlaying", (event: CustomEvent) => {
			if (event.detail.videoIsPlaying) {
				this.dashPlayer.play();
			} else {
				this.dashPlayer.pause();
			}
		});
		videoControls.setAttribute("parentHeight", this.data.height);
		videoControls.setAttribute("parentWidth", this.data.width);
		this.el.appendChild(videoControls);
	},
	createDashVideo: async function (muted: boolean) {
		this.videoElement = document.createElement(
			"video"
		) as unknown as HTMLVideoElement;
		this.videoElement.id = getUniqueId();
		this.videoElement.setAttribute("crossorigin", "anonymous");
		const firstStreamUrl =
			this.defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
		this.dashPlayer = dashjs.MediaPlayer().create();
		this.dashPlayer.initialize(this.videoElement, firstStreamUrl, true);
		if (muted) {
			this.dashPlayer.setMute(true);
		}
	},
	startNewStream: async function (channelDifference: 1 | -1): Promise<void> {
		this.aVideo.setAttribute("src", "#" + this.loadingVideoElement.id);
		this.currentChannelIndex += channelDifference;
		this.lastChannelDifference = channelDifference;
		if (this.currentChannelIndex < 0) {
			this.currentChannelIndex = this.defaultChannels.length - 1;
		} else if (this.currentChannelIndex === this.defaultChannels.length) {
			this.currentChannelIndex = 0;
		}

		const nextStreamUrl =
			this.defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;

		if (nextStreamUrl === undefined) {
			console.error(
				"Could not find a stream for the channel ",
				this.defaultChannels[this.currentChannelIndex].channel.name
			);
			this.startNewStream(channelDifference);
		}
		(this.dashPlayer as dashjs.MediaPlayerClass).attachSource(nextStreamUrl);
	},
	checkPlaying: function () {
		console.log(this.dashPlayer);
	},
});

function getUniqueId(): string {
	return (
		Date.now().toString(36) +
		Math.floor(
			Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
		).toString(36)
	);
}
