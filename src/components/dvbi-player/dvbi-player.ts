import dashjs from "dashjs";
import { DVBIClient } from "../../dvb-i-client/dvb-i-client";
function init() {
	AFRAME.registerPrimitive("a-dvbi-player", {
		defaultComponents: {
			"dvbi-player": {},
			position: { x: 0, y: 0, z: -8 },
		},
		mappings: {
			width: "dvbi-player.width",
			height: "dvbi-player.height",
		},
	});

	AFRAME.registerComponent("dvbi-player", {
		schema: {
			width: { default: 16, min: 0 },
			height: { default: 9, min: 0 },
		},
		init: function () {
			this.currentChannelIndex = 0;
			this.videoElement = document.createElement(
				"video"
			) as unknown as HTMLVideoElement;
			this.videoElement.setAttribute("crossorigin", "anonymous");
			this.videoElement.id = getUniqueId();
			this.dvbiClient = new DVBIClient(
				"https://dvb-i.net/production/services.php/de"
			);

			this.createDashPlayer(this.videoElement);

			// add the video as a reference for the a-video primitive
			this.el.appendChild(this.videoElement);
			// create  the a-video primitive
			const aVideo = document.createElement("a-video");
			aVideo.setAttribute("width", this.data.width);
			aVideo.setAttribute("height", this.data.height);
			aVideo.setAttribute("src", "#" + this.videoElement.id);
			this.el.appendChild(aVideo);

			// create the video controls
			const videoControls = document.createElement("a-dvbi-player-controls");
			videoControls.addEventListener("nextChannel", () => this.nextChannel());
			videoControls.addEventListener("previousChannel", () =>
				this.previousChannel()
			);
			videoControls.addEventListener("videoIsPlaying", (event: CustomEvent) => {
				if (event.detail.videoIsPlaying) {
					this.videoElement.play();
				} else {
					this.videoElement.pause();
				}
			});
			videoControls.setAttribute("parentHeight", this.data.height);
			videoControls.setAttribute("parentWidth", this.data.width);
			this.el.appendChild(videoControls);
		},
		createDashPlayer: async function (videoElement: HTMLVideoElement) {
			const defaultChannels = await this.dvbiClient.getDefaultChannels();
			const firstStreamUrl =
				defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
			this.dashPlayer = dashjs.MediaPlayer().create();
			this.dashPlayer.initialize(videoElement, firstStreamUrl, true);
		},
		nextChannel: async function (): Promise<void> {
			const defaultChannels = await this.dvbiClient.getDefaultChannels();
			this.currentChannelIndex++;
			if (this.currentChannelIndex === defaultChannels.length) {
				this.currentChannelIndex = 0;
			}
			const nextStreamUrl =
				defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
			if (nextStreamUrl === undefined) {
				console.error(
					"Could not find a stream for the channel ",
					defaultChannels[this.currentChannelIndex].channel.name
				);
				return;
			}
			this.dashPlayer.attachSource(nextStreamUrl);
		},
		previousChannel: async function (): Promise<void> {
			const defaultChannels = await this.dvbiClient.getDefaultChannels();
			if (this.currentChannelIndex === 0) {
				this.currentChannelIndex = defaultChannels.length;
			}
			this.currentChannelIndex--;
			const nextStreamUrl =
				defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
			if (nextStreamUrl === undefined) {
				console.error(
					"Could not find a stream for the channel ",
					defaultChannels[this.currentChannelIndex].channel.name
				);
				return;
			}
			this.dashPlayer.attachSource(nextStreamUrl);
		},
	});
}

function getUniqueId(): string {
	return (
		Date.now().toString(36) +
		Math.floor(
			Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
		).toString(36)
	);
}

const DVBIPlayer = {
	init: () => init(),
};

export { DVBIPlayer };
