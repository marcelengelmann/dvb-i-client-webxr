import dashjs, { MediaPlayerClass } from "dashjs";
import { DVBIClient } from "../../dvb-i-client/dvb-i-client";

export class DVBIPlayer {
	private videoElement: HTMLVideoElement;
	private dvbiClient: DVBIClient;
	private currentChannelIndex = 0;
	private dashPlayer: MediaPlayerClass;
	constructor() {
		this.videoElement = document.createElement(
			"video"
		) as unknown as HTMLVideoElement;
		this.videoElement.setAttribute("crossorigin", "anonymous");
		this.videoElement.id = this.getUniqueId();
		this.dvbiClient = new DVBIClient(
			"https://dvb-i.net/production/services.php/de"
		);

		this.createPlayerComponent(this.videoElement);
		this.createDashPlayer(this.videoElement);
	}

	public async nextChannel(): Promise<void> {
		const defaultChannels = await this.dvbiClient.getDefaultChannels();
		if (this.currentChannelIndex === defaultChannels.length) {
			this.currentChannelIndex = 0;
		}
		const nextStreamUrl =
			defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
		this.currentChannelIndex++;
		if (nextStreamUrl === undefined) {
			console.error(
				"Could not find a stream for the channel ",
				defaultChannels[this.currentChannelIndex].channel.name
			);
			(window as any).nextVideo();
			return;
		}
		this.dashPlayer.attachSource(nextStreamUrl);
	}

	private async createDashPlayer(videoElement: HTMLVideoElement) {
		const defaultChannels = await this.dvbiClient.getDefaultChannels();
		const firstStreamUrl =
			defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
		this.currentChannelIndex++;
		this.dashPlayer = dashjs.MediaPlayer().create();
		this.dashPlayer.initialize(videoElement, firstStreamUrl, true);
	}

	private createPlayerComponent(videoElement: HTMLVideoElement): void {
		const dvbiPlayer = this;
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
				// add the video as a reference for the a-video primitive
				this.el.appendChild(videoElement);
				// create  the a-video primitive
				const aVideo = document.createElement("a-video");
				aVideo.setAttribute("width", this.data.width);
				aVideo.setAttribute("height", this.data.height);
				aVideo.setAttribute("src", "#" + videoElement.id);
				this.el.appendChild(aVideo);

				// create the video controls
				const videoControls = document.createElement("a-dvbi-player-controls");
				videoControls.addEventListener("nextChannel", () =>
					dvbiPlayer.nextChannel()
				);
				videoControls.addEventListener("previousChannel", () =>
					dvbiPlayer.nextChannel()
				);
				videoControls.addEventListener(
					"videoIsPlaying",
					(event: CustomEvent) => {
						if (event.detail.videoIsPlaying) {
							videoElement.play();
						} else {
							videoElement.pause();
						}
					}
				);
				videoControls.setAttribute("parentHeight", this.data.height);
				videoControls.setAttribute("parentWidth", this.data.width);
				this.el.appendChild(videoControls);
			},
		});
	}

	private getUniqueId(): string {
		return (
			Date.now().toString(36) +
			Math.floor(
				Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
			).toString(36)
		);
	}
}
