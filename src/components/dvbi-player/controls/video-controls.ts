import { Schema } from "aframe";
import nextChannelImage from "../../../assets/nextChannel.png";
import pauseImage from "../../../assets/pause.png";
import playImage from "../../../assets/play.png";
import previousChannelImage from "../../../assets/previousChannel.png";
import mutedImage from "../../../assets/volume-off.png";
import unmutedImage from "../../../assets/volume.png";
import { BaseComponent } from "../../BaseComponent/base-component";
import { toComponent } from "../../BaseComponent/to-component";

AFRAME.registerPrimitive("a-dvbi-player-controls", {
	defaultComponents: {
		"dvbi-player-controls": {},
	},
	mappings: {
		parentwidth: "dvbi-player-controls.parentwidth",
		parentheight: "dvbi-player-controls.parentheight",
		playing: "dvbi-player-controls.playing",
		muted: "dvbi-player-controls.muted",
	},
});

export type DVBIPlayerControlsComponentData = {
	parentwidth: number;
	parentheight: number;
	playing: boolean;
	muted: boolean;
};
export class DVBIPlayerControlsComponent extends BaseComponent<DVBIPlayerControlsComponentData> {
	static schema: Schema<DVBIPlayerControlsComponentData> = {
		parentwidth: { type: "number" },
		parentheight: { type: "number" },
		playing: { type: "boolean", default: true },
		muted: { type: "boolean", default: false },
	};
	private videoIsPlaying!: boolean;
	private videoIsMuted!: boolean;
	private playButton!: HTMLElement;
	private muteButton!: HTMLElement;

	public init() {
		this.videoIsPlaying = this.data.playing;
		this.videoIsMuted = this.data.muted;
		const controlsUIHeight = this.data.parentheight / 11;
		const buttonSize = controlsUIHeight / 1.25;
		this.onPreviousChannelClick = this.onPreviousChannelClick.bind(this);
		this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
		this.onNextChannelClick = this.onNextChannelClick.bind(this);
		this.onMuteButtonClick = this.onMuteButtonClick.bind(this);

		this.createControlsPlane(
			this.data.parentwidth,
			controlsUIHeight,
			`0 ${-(this.data.parentheight / 2) + controlsUIHeight / 2} 0.01`
		);

		// create the previous channel button
		this.createControlButton(
			buttonSize,
			previousChannelImage,
			-2 * buttonSize,
			this.onPreviousChannelClick
		);

		// create the play button
		this.playButton = this.createControlButton(
			buttonSize,
			this.videoIsPlaying ? pauseImage : playImage,
			0,
			this.onPlayButtonClick
		);
		// create the next channel button
		this.createControlButton(
			buttonSize,
			nextChannelImage,
			2 * buttonSize,
			this.onNextChannelClick
		);

		// create mute button
		this.muteButton = this.createControlButton(
			buttonSize,
			this.videoIsMuted ? mutedImage : unmutedImage,
			this.data.parentwidth / 2 - 2 * buttonSize,
			this.onMuteButtonClick
		);
	}
	private createControlsPlane(width: number, height: number, position: string) {
		// Create plane to use for raycaster to show controls
		const geometry = new AFRAME.THREE.PlaneGeometry(width, height);

		// Create material.
		const material = new AFRAME.THREE.MeshStandardMaterial({
			opacity: 0,
			transparent: true,
		});

		// Create mesh.
		const mesh = new AFRAME.THREE.Mesh(geometry, material);

		// Set mesh on entity.
		this.el.setObject3D("mesh", mesh);
		this.el.classList.add("raycastObject");

		// set the controls position
		this.el.setAttribute("position", position);
		// only show controls, when looking at the bottom of the stream
		this.el.addEventListener("mouseenter", () =>
			this.el.setAttribute("visible", true)
		);
		this.el.addEventListener("mouseleave", () =>
			this.el.setAttribute("visible", false)
		);
		this.el.setAttribute("visible", false);
	}
	private createControlButton(
		buttonSize: number,
		image: string,
		xPosition: number,
		clickFunction: () => void
	) {
		const controlButton: HTMLElement = document.createElement("a-image");
		controlButton.setAttribute("width", "" + buttonSize);
		controlButton.setAttribute("height", "" + buttonSize);
		controlButton.setAttribute("position", `${xPosition} 0 0.01`);
		controlButton.addEventListener("click", clickFunction);
		controlButton.classList.add("raycastObject");
		controlButton.setAttribute("src", image);
		this.el.appendChild(controlButton);
		return controlButton;
	}
	private onPlayButtonClick() {
		this.videoIsPlaying = !this.videoIsPlaying;
		if (this.videoIsPlaying) {
			this.playButton.setAttribute("src", pauseImage);
		} else {
			this.playButton.setAttribute("src", playImage);
		}
		this.el.emit(
			"videoIsPlaying",
			{ videoIsPlaying: this.videoIsPlaying },
			false
		);
	}
	private onPreviousChannelClick() {
		this.el.emit("previousChannel", undefined, false);
	}
	private onNextChannelClick() {
		this.el.emit("nextChannel", undefined, false);
	}
	private onMuteButtonClick() {
		this.videoIsMuted = !this.videoIsMuted;
		if (this.videoIsMuted) {
			this.muteButton.setAttribute("src", mutedImage);
		} else {
			this.muteButton.setAttribute("src", unmutedImage);
		}
		this.el.emit("videoIsMuted", { videoIsMuted: this.videoIsMuted }, false);
	}
}

AFRAME.registerComponent(
	"dvbi-player-controls",
	toComponent(DVBIPlayerControlsComponent)
);
