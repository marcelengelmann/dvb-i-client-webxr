import { Entity, Schema } from "aframe";
import dashjs, { MediaPlayerClass } from "dashjs";
import streamErrorImage from "../../assets/stream-error.png";
import streamLoadingImage from "../../assets/stream-loading.png";
import { Channels } from "../../dvb-i-client/models/channel-region.model";
import { DVBI_CLIENT } from "../../main";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

AFRAME.registerPrimitive("a-dvbi-player", {
	defaultComponents: {
		"dvbi-player": {},
		position: { x: 0, y: 1.6, z: -2 },
	},
	mappings: {
		width: "dvbi-player.width",
		muted: "dvbi-player.muted",
	},
});

type DVBIPlayerComponentData = {
	muted: boolean;
	width: number;
};
export class DVBIPlayerComponent extends BaseComponent<DVBIPlayerComponentData> {
	static schema: Schema<DVBIPlayerComponentData> = {
		width: { type: "number", default: 4 },
		muted: { type: "boolean", default: false },
	};
	private defaultChannels!: Channels;
	private currentChannelIndex = 0;
	private dashPlayer!: MediaPlayerClass;
	private aVideo!: Entity;
	private videoElement!: HTMLVideoElement;
	private informationImage!: Entity;
	private videoControls!: Entity;

	public async init() {
		const componentHeight = this.data.width / (16 / 9);
		this.defaultChannels = await DVBI_CLIENT.getDefaultChannels();
		this.init3DObject(this.data.width, componentHeight);
		this.createInformationImage(this.data.width, componentHeight);
		// Must first create aframe video before creating the dash player
		this.createAFrameVideo(this.data.width, componentHeight);
		this.createDashPlayer(this.data.muted);

		// create the video controls
		this.createVideoControls(this.data.width, componentHeight, this.data.muted);
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
			const height = this.data.width / (16 / 9);
			this.videoControls.setAttribute("parentwidth", "" + this.data.width);
			this.videoControls.setAttribute("parentheight", "" + height);
			this.aVideo.setAttribute("width", "" + this.data.width);
			this.aVideo.setAttribute("height", "" + height);
			this.informationImage.setAttribute("width", "" + this.data.width);
			this.informationImage.setAttribute("height", "" + height);
			this.init3DObject(this.data.width, height);
		}
	}

	private createAFrameVideo(width: number, componentHeight: number) {
		this.videoElement = document.createElement(
			"video"
		) as unknown as HTMLVideoElement;
		this.videoElement.id = this.getUniqueId();
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
	}

	private createInformationImage(width: number, height: number) {
		this.informationImage = document.createElement("a-image");
		this.informationImage.id = "informationImage";
		this.informationImage.setAttribute("src", streamLoadingImage);
		this.informationImage.setAttribute("width", "" + width);
		this.informationImage.setAttribute("height", "" + height);
		this.el.appendChild(this.informationImage);
	}

	private createVideoControls(width: number, height: number, muted: boolean) {
		this.videoControls = document.createElement("a-dvbi-player-controls");
		this.videoControls.setAttribute("parentwidth", "" + width);
		this.videoControls.setAttribute("parentheight", "" + height);
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
		this.videoControls.setAttribute("parentHeight", "" + height);
		this.videoControls.setAttribute("parentWidth", "" + width);
		this.el.appendChild(this.videoControls);
	}

	private async createDashPlayer(muted: boolean) {
		const firstStreamUrl =
			this.defaultChannels[this.currentChannelIndex].channel.dashStreamUrl;
		this.dashPlayer = dashjs.MediaPlayer().create();
		this.dashPlayer.initialize(this.videoElement, firstStreamUrl, true);
		if (muted) {
			this.dashPlayer.setMute(true);
		}
		this.dashPlayer.on("error", (e: dashjs.ErrorEvent) => {
			console.log(e);
			this.showErrorImage();
		});
		this.dashPlayer.on("canPlay", () => {
			this.showVideo();
		});
	}

	private async startNewStream(channelDifference: 1 | -1): Promise<void> {
		this.showLoading();
		this.currentChannelIndex += channelDifference;
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

	private getUniqueId(): string {
		return (
			Date.now().toString(36) +
			Math.floor(
				Math.pow(10, 12) + Math.random() * 9 * Math.pow(10, 12)
			).toString(36)
		);
	}
}

AFRAME.registerComponent("dvbi-player", toComponent(DVBIPlayerComponent));
