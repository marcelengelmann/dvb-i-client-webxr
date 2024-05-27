import { Entity, Schema } from "aframe";
import dashjs, { MediaPlayerClass } from "dashjs";
import { Channels } from "../../dvb-i-client/models/channel-region.model";
import { DVBI_CLIENT } from "../../main";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";
import { DroppedEventData } from "../controls/dvbi-controller";
import streamErrorImage from "/src/assets/stream-error.png";
import streamLoadingImage from "/src/assets/stream-loading.png";

const DEFAULT_WIDTH = 4;

AFRAME.registerPrimitive("a-dvbi-player", {
	defaultComponents: {
		"dvbi-player": {},
		position: { x: 0, y: 1.6, z: -2 },
	},
	mappings: {
		width: "dvbi-player.width",
		muted: "dvbi-player.muted",
		channelnumber: "dvbi-player.channelnumber",
	},
});

type DVBIPlayerComponentData = {
	muted: boolean;
	width: number;
	channelnumber: number;
};
export class DVBIPlayerComponent extends BaseComponent<DVBIPlayerComponentData> {
	static schema: Schema<DVBIPlayerComponentData> = {
		width: { type: "number", default: DEFAULT_WIDTH },
		muted: { type: "boolean", default: false },
		channelnumber: { type: "number", default: -1 },
	};
	private defaultChannels!: Channels;
	private currentChannelIndex = 0;
	private dashPlayer!: MediaPlayerClass;
	private aVideo!: Entity;
	private videoElement!: HTMLVideoElement;
	private informationImage!: Entity;
	private videoControls!: Entity;
	resizeHandlerPlane: any;

	public async init() {
		const width = DEFAULT_WIDTH;
		const height = DEFAULT_WIDTH / (16 / 9);
		this.defaultChannels = await DVBI_CLIENT.getDefaultChannels();

		this.init3DObject(width, height);
		this.createInformationImage(width, height);
		// Must first create aframe video before creating the dash player
		this.createAFrameVideo(width, height);
		this.createDashPlayer(this.data.muted);

		// create the video controls
		this.createVideoControls(this.data.muted);

		const scaleAmount = this.data.width / DEFAULT_WIDTH;
		this.el.setAttribute("scale", `${scaleAmount} ${scaleAmount} 1`);
	}

	public async update(oldData: DVBIPlayerComponentData) {
		if (Object.keys(oldData).length === 0) {
			return;
		}

		if (this.data.muted !== oldData.muted) {
			this.dashPlayer.setMute(this.data.muted);
			this.videoControls.setAttribute("muted", "" + this.data.muted);
		}

		if (this.data.width !== oldData.width) {
			const scaleAmount = this.data.width / DEFAULT_WIDTH;
			this.el.setAttribute("scale", `${scaleAmount} ${scaleAmount} 1`);
			this.videoControls.object3D.position.setZ(10);
		}

		if (this.data.channelnumber !== oldData.channelnumber) {
			this.startNewStream(undefined, this.data.channelnumber);
		}
	}

	private createAFrameVideo(width: number, componentHeight: number) {
		this.videoElement = document.createElement(
			"video"
		) as unknown as HTMLVideoElement;
		this.videoElement.id = DVBIPlayerComponent.getUniqueId();
		this.videoElement.setAttribute("crossorigin", "anonymous");
		// add the video as a reference for the a-video primitive
		this.el.appendChild(this.videoElement);
		// create  the a-video primitive
		this.aVideo = document.createElement("a-video");
		this.aVideo.setAttribute("width", "" + width);
		this.aVideo.setAttribute("height", "" + componentHeight);
		this.aVideo.setAttribute("src", "#" + this.videoElement.id);
		this.aVideo.setAttribute("visible", "false");
		this.el.appendChild(this.aVideo);
	}

	private init3DObject(width: number, height: number) {
		// Create a 3D Object that is hittable by the raycaster
		const geometry = new AFRAME.THREE.PlaneGeometry(width, height);

		const material = new AFRAME.THREE.MeshStandardMaterial({
			opacity: 0,
			transparent: true,
		});
		const mesh = new AFRAME.THREE.Mesh(geometry, material);
		this.el.setObject3D("mesh", mesh);
		// set element as grabbable and therefore moveable, by adding the class used by the grabber component
		this.el.classList.add("grabbable");
		// set element as droppable -> streams can be dropped onto this element
		this.el.classList.add("droppable");
		// set element as resizeable
		this.el.classList.add("resizeable");

		this.el.addEventListener("dropped", (event: Event) => {
			const eventData = (event as CustomEvent).detail as DroppedEventData;
			this.startNewStream(undefined, (eventData.element as any).channelNumber);
		});

		this.el.addEventListener("resizeBy", (event: Event) => {
			const resizeBy = (event as CustomEvent).detail as number;
			this.el.setAttribute("width", this.data.width - resizeBy);
		});
	}

	private createInformationImage(width: number, height: number) {
		this.informationImage = document.createElement("a-image");
		this.informationImage.id = "informationImage";
		this.informationImage.setAttribute("src", streamLoadingImage);
		this.informationImage.setAttribute("width", "" + width);
		this.informationImage.setAttribute("height", "" + height);
		this.el.appendChild(this.informationImage);
	}

	private createVideoControls(muted: boolean) {
		this.videoControls = document.createElement("a-dvbi-player-controls");
		this.videoControls.setAttribute("muted", "" + muted);
		this.videoControls.setAttribute("playing", "" + true);
		this.videoControls.addEventListener("nextChannel", () =>
			this.startNewStream(1)
		);
		this.videoControls.addEventListener("previousChannel", () =>
			this.startNewStream(-1)
		);
		this.videoControls.addEventListener("videoIsPlaying", (event: Event) => {
			const e = event as CustomEvent;
			if (e.detail.videoIsPlaying) {
				this.dashPlayer.play();
			} else {
				this.dashPlayer.pause();
			}
		});
		this.videoControls.addEventListener("videoIsMuted", (event: Event) => {
			const e = event as CustomEvent;
			this.dashPlayer.setMute(e.detail.videoIsMuted);
		});
		this.el.appendChild(this.videoControls);
	}

	private async createDashPlayer(muted: boolean) {
		let firstStreamUrl: string | undefined;
		if (this.data.channelnumber !== -1) {
			const streamIndex = this.defaultChannels.findIndex(
				(channel) => channel.channelNumber === this.data.channelnumber
			);
			if (streamIndex !== -1) {
				this.currentChannelIndex = streamIndex;
				firstStreamUrl =
					this.defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
			}
		} else {
			firstStreamUrl =
				this.defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
		}
		this.dashPlayer = dashjs.MediaPlayer().create();
		this.dashPlayer.initialize(this.videoElement, firstStreamUrl ?? "", true);
		if (muted) {
			this.dashPlayer.setMute(true);
		}
		this.dashPlayer.on("error", (e: dashjs.ErrorEvent) => {
			console.error(e);
			this.showErrorImage();
		});
		this.dashPlayer.on("canPlay", () => {
			this.showVideo();
		});
	}

	private startNewStream(
		channelDifference?: 1 | -1,
		channelNumber?: number
	): void {
		this.showLoading();
		let nextStreamUrl: string | undefined;
		if (channelDifference) {
			this.currentChannelIndex += channelDifference;
			if (this.currentChannelIndex < 0) {
				this.currentChannelIndex = this.defaultChannels.length - 1;
			} else if (this.currentChannelIndex === this.defaultChannels.length) {
				this.currentChannelIndex = 0;
			}
			nextStreamUrl =
				this.defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
		} else if (channelNumber) {
			const channelIndex = this.defaultChannels.findIndex(
				(channel) => channel.channelNumber === channelNumber
			);
			this.currentChannelIndex = channelIndex;
			if (this.currentChannelIndex !== -1) {
				nextStreamUrl =
					this.defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
			} else {
				console.error(
					"Could not find the channel with the channel number ",
					channelNumber
				);
				this.showErrorImage();
				return;
			}
		}

		if (nextStreamUrl === undefined) {
			console.error(
				"Could not find a stream for the channel ",
				this.defaultChannels[this.currentChannelIndex].channel.name
			);

			this.showErrorImage();
			return;
		}

		(this.dashPlayer as dashjs.MediaPlayerClass).attachSource(nextStreamUrl);
	}

	private showLoading() {
		this.aVideo.setAttribute("visible", "false");
		this.informationImage.setAttribute("src", streamLoadingImage);
		this.informationImage.setAttribute("visible", "true");
	}
	private showVideo() {
		this.informationImage.setAttribute("visible", "false");
		this.aVideo.setAttribute("visible", "true");
	}

	private showErrorImage() {
		this.informationImage.setAttribute("visible", "true");
		this.informationImage.setAttribute("src", streamErrorImage);
		this.aVideo.setAttribute("visible", "false");
	}

	private static getUniqueId(): string {
		return (
			Date.now().toString(36) +
			Math.floor(
				Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
			).toString(36)
		);
	}
}

AFRAME.registerComponent("dvbi-player", toComponent(DVBIPlayerComponent));
