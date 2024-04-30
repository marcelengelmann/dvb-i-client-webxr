import { Entity, Schema } from "aframe";
import { BaseComponent } from "../../base-component/base-component";
import { toComponent } from "../../base-component/class-to-component";
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
	},
});

type DVBIPlayerControlsComponentData = {
	playing: boolean;
	muted: boolean;
};
type ControlButtonNames =
	| "PreviousChannel"
	| "PlayPause"
	| "NextChannel"
	| "Mute"
	| "Resize";
export class DVBIPlayerControlsComponent extends BaseComponent<DVBIPlayerControlsComponentData> {
	static schema: Schema<DVBIPlayerControlsComponentData> = {
		playing: { type: "boolean", default: true },
		muted: { type: "boolean", default: false },
	};
	private buttonSize!: number;
	private controlButtons = new Map<ControlButtonNames, Entity>();

	public init() {
		this.onPreviousChannelClick = this.onPreviousChannelClick.bind(this);
		this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
		this.onNextChannelClick = this.onNextChannelClick.bind(this);
		this.onMuteButtonClick = this.onMuteButtonClick.bind(this);
		const defaultWidth = 4;
		const defaultHeight = 2.25;
		const uiHeight = defaultHeight / 11;
		this.buttonSize = uiHeight / 1.25;

		this.create3DObject(defaultWidth, uiHeight);

		this.el.setAttribute(
			"position",
			`0 ${-(defaultHeight / 2) + uiHeight / 2} 0.01`
		);

		// only show controls, when looking at the bottom of the stream
		this.el.setAttribute("visible", false);
		this.el.addEventListener("mouseenter", () =>
			this.el.setAttribute("visible", true)
		);
		this.el.addEventListener("mouseleave", () =>
			this.el.setAttribute("visible", false)
		);

		// create the previous channel button
		const previousChannelButton = this.createControlButton(
			this.buttonSize,
			previousChannelImage,
			-2 * this.buttonSize,
			this.onPreviousChannelClick
		);
		this.controlButtons.set("PreviousChannel", previousChannelButton);

		// create the play button
		const playButton = this.createControlButton(
			this.buttonSize,
			this.data.playing ? pauseImage : playImage,
			0,
			this.onPlayButtonClick
		);
		this.controlButtons.set("PlayPause", playButton);
		// create the next channel button
		const nextChannelButton = this.createControlButton(
			this.buttonSize,
			nextChannelImage,
			2 * this.buttonSize,
			this.onNextChannelClick
		);
		this.controlButtons.set("NextChannel", nextChannelButton);
		// create mute button
		const muteButton = this.createControlButton(
			this.buttonSize,
			this.data.muted ? mutedImage : unmutedImage,
			-1.6,
			this.onMuteButtonClick
		);

		this.controlButtons.set("Mute", muteButton);

		// create resize plane
		const resizePlane = this.createControlButton(
			this.buttonSize,
			resizeImage,
			1.9
		);
		resizePlane.setAttribute("rotation", "0 0 -90");
		resizePlane.classList.add("resizeHandler");

		this.controlButtons.set("Resize", resizePlane);
	}

	public async update(oldData: DVBIPlayerControlsComponentData) {
		if (Object.keys(oldData).length === 0) {
			return;
		}

		if (this.data.muted !== oldData.muted) {
			const muteButton = this.controlButtons.get("Mute")!;
			if (this.data.muted) {
				muteButton.setAttribute("src", mutedImage);
			} else {
				muteButton.setAttribute("src", unmutedImage);
			}
			this.el.emit("videoIsMuted", { videoIsMuted: this.data.muted }, false);
		}

		if (this.data.playing !== oldData.playing) {
			const playButton = this.controlButtons.get("PlayPause")!;

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
	}
	private create3DObject(width: number, height: number) {
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
		this.el.classList.add("clickable");
	}
	private createControlButton(
		buttonSize: number,
		image: string,
		xPosition: number,
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
		this.el.appendChild(controlButton);
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
}

AFRAME.registerComponent(
	"dvbi-player-controls",
	toComponent(DVBIPlayerControlsComponent)
);
