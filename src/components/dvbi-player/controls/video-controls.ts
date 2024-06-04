import { Entity, Schema } from "aframe";
import { getCorsProxyUrl } from "../../../utils/corsproxy";
import { BaseComponent } from "../../base-component/base-component";
import { toComponent } from "../../base-component/class-to-component";
import closeImage from "/src/assets/close.png";
import nextChannelImage from "/src/assets/nextChannel.png";
import pauseImage from "/src/assets/pause.png";
import playImage from "/src/assets/play.png";
import previousChannelImage from "/src/assets/previousChannel.png";
import resizeImage from "/src/assets/resize.png";
import mutedImage from "/src/assets/volume-off.png";
import unmutedImage from "/src/assets/volume.png";

AFRAME.registerPrimitive("a-dvbi-player-controls", {
	defaultComponents: {
		"dvbi-player-controls": {},
	},
	mappings: {
		playing: "dvbi-player-controls.playing",
		muted: "dvbi-player-controls.muted",
		channellogo: "dvbi-player-controls.channellogo",
	},
});

type DVBIPlayerControlsComponentData = {
	playing: boolean;
	muted: boolean;
	channellogo: string;
};
type ControlElementNames =
	| "PreviousChannel"
	| "PlayPause"
	| "NextChannel"
	| "Mute"
	| "Resize"
	| "Close"
	| "Logo";
export class DVBIPlayerControlsComponent extends BaseComponent<DVBIPlayerControlsComponentData> {
	static schema: Schema<DVBIPlayerControlsComponentData> = {
		playing: { type: "boolean", default: true },
		muted: { type: "boolean", default: false },
		channellogo: { type: "string", default: "" },
	};
	private buttonSize!: number;
	private controlElements = new Map<ControlElementNames, Entity>();
	private controlsAreaTop!: Entity;
	private controlsAreaBottom!: Entity;

	public async init() {
		this.onPreviousChannelClick = this.onPreviousChannelClick.bind(this);
		this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
		this.onNextChannelClick = this.onNextChannelClick.bind(this);
		this.onMuteButtonClick = this.onMuteButtonClick.bind(this);
		this.onCloseButtonClick = this.onCloseButtonClick.bind(this);
		const defaultWidth = 4;
		const defaultHeight = 2.25;
		const uiHeight = defaultHeight / 11;
		this.buttonSize = uiHeight / 1.25;

		this.create3DObjects(defaultWidth, uiHeight);

		this.controlsAreaBottom.setAttribute(
			"position",
			`0 ${-(defaultHeight / 2) + uiHeight / 2} 0.01`
		);

		this.controlsAreaTop.setAttribute(
			"position",
			`0 ${defaultHeight / 2 - uiHeight / 2} 0.01`
		);

		// only show controls, when looking at the bottom of the stream
		this.controlsAreaBottom.setAttribute("visible", false);
		this.controlsAreaTop.setAttribute("visible", false);
		this.controlsAreaBottom.addEventListener("mouseenter", () => {
			this.controlsAreaBottom.setAttribute("visible", true);
			this.controlsAreaTop.setAttribute("visible", true);
		});
		this.controlsAreaBottom.addEventListener("mouseleave", () => {
			this.controlsAreaBottom.setAttribute("visible", false);
			this.controlsAreaTop.setAttribute("visible", false);
		});
		this.controlsAreaTop.addEventListener("mouseenter", () => {
			this.controlsAreaBottom.setAttribute("visible", true);
			this.controlsAreaTop.setAttribute("visible", true);
		});
		this.controlsAreaTop.addEventListener("mouseleave", () => {
			this.controlsAreaBottom.setAttribute("visible", false);
			this.controlsAreaTop.setAttribute("visible", false);
		});

		// create the previous channel button
		const previousChannelButton = this.createControlButton(
			this.buttonSize,
			previousChannelImage,
			-2 * this.buttonSize,
			this.controlsAreaBottom,
			this.onPreviousChannelClick
		);
		this.controlElements.set("PreviousChannel", previousChannelButton);

		// create the play button
		const playButton = this.createControlButton(
			this.buttonSize,
			this.data.playing ? pauseImage : playImage,
			0,
			this.controlsAreaBottom,
			this.onPlayButtonClick
		);
		this.controlElements.set("PlayPause", playButton);
		// create the next channel button
		const nextChannelButton = this.createControlButton(
			this.buttonSize,
			nextChannelImage,
			2 * this.buttonSize,
			this.controlsAreaBottom,
			this.onNextChannelClick
		);
		this.controlElements.set("NextChannel", nextChannelButton);
		// create mute button
		const muteButton = this.createControlButton(
			this.buttonSize,
			this.data.muted ? mutedImage : unmutedImage,
			-1.6,
			this.controlsAreaBottom,
			this.onMuteButtonClick
		);

		this.controlElements.set("Mute", muteButton);

		// create resize plane
		const resizePlane = this.createControlButton(
			this.buttonSize,
			resizeImage,
			1.9,
			this.controlsAreaBottom
		);
		resizePlane.setAttribute("rotation", "0 0 -90");
		resizePlane.classList.add("resizeHandler");
		this.controlElements.set("Resize", resizePlane);

		// create close button
		const closeButton = this.createControlButton(
			this.buttonSize,
			closeImage,
			1.8,
			this.controlsAreaTop,
			this.onCloseButtonClick
		);
		this.controlElements.set("Close", closeButton);

		// create channel logo element
		const logo = this.createControlButton(
			this.buttonSize,
			"",
			-1.75,
			this.controlsAreaTop
		);

		logo.setAttribute("width", this.buttonSize * 2.5);

		this.controlElements.set("Logo", logo);
	}

	public async update(oldData: DVBIPlayerControlsComponentData) {
		if (this.data.muted !== oldData.muted) {
			const muteButton = this.controlElements.get("Mute")!;
			if (this.data.muted) {
				muteButton.setAttribute("src", mutedImage);
			} else {
				muteButton.setAttribute("src", unmutedImage);
			}
			this.el.emit("videoIsMuted", { videoIsMuted: this.data.muted }, false);
		}

		if (this.data.playing !== oldData.playing) {
			const playButton = this.controlElements.get("PlayPause")!;

			if (this.data.playing) {
				playButton.setAttribute("src", pauseImage);
			} else {
				playButton.setAttribute("src", playImage);
			}
			this.el.emit(
				"videoIsPlaying",
				{ videoIsPlaying: this.data.playing },
				false
			);
		}
		if (this.data.channellogo != oldData.channellogo) {
			const logoElement = this.controlElements.get("Logo")!;
			logoElement.setAttribute("src", "");
			logoElement.setAttribute("src", getCorsProxyUrl(this.data.channellogo));
			console.log(getCorsProxyUrl(this.data.channellogo));
		}
	}
	private create3DObjects(width: number, height: number) {
		// Create plane to use for raycaster to show controls
		const geometry = new AFRAME.THREE.PlaneGeometry(width - 0.02, height); // -0.02 for small width correction

		// Create material.
		const material = new AFRAME.THREE.MeshStandardMaterial({
			opacity: 0.1,
			transparent: true,
			color: "#000",
		});

		// Create mesh.
		const mesh = new AFRAME.THREE.Mesh(geometry, material);

		this.controlsAreaBottom = document.createElement("a-entity") as Entity;
		this.controlsAreaTop = document.createElement("a-entity") as Entity;
		this.controlsAreaBottom.setObject3D("mesh", mesh);
		this.controlsAreaTop.setObject3D("mesh", mesh.clone(true));

		this.el.appendChild(this.controlsAreaBottom);
		this.el.appendChild(this.controlsAreaTop);
		this.el.classList.add("clickable");
	}
	private createControlButton(
		buttonSize: number,
		image: string,
		xPosition: number,
		parentElement: Entity,
		clickFunction?: () => void
	) {
		const controlButton = document.createElement("a-image");
		controlButton.setAttribute("width", "" + buttonSize);
		controlButton.setAttribute("height", "" + buttonSize);
		controlButton.setAttribute("position", `${xPosition} 0 0.01`);
		controlButton.setAttribute("src", image);
		if (clickFunction) {
			controlButton.addEventListener("click", clickFunction);
			controlButton.classList.add("clickable");
		}
		parentElement.appendChild(controlButton);
		return controlButton;
	}
	private onPlayButtonClick() {
		this.el.setAttribute("playing", "" + !this.data.playing);
	}
	private onPreviousChannelClick() {
		this.el.emit("previousChannel", undefined, false);
	}
	private onNextChannelClick() {
		this.el.emit("nextChannel", undefined, false);
	}
	private onMuteButtonClick() {
		this.el.setAttribute("muted", "" + !this.data.muted);
	}
	private onCloseButtonClick() {
		this.el.emit("closeStream", undefined, false);
	}
}

AFRAME.registerComponent(
	"dvbi-player-controls",
	toComponent(DVBIPlayerControlsComponent)
);
