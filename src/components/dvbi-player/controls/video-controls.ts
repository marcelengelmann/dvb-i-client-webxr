import { Entity, Schema } from "aframe";
import nextChannelImage from "../../../assets/nextChannel.png";
import pauseImage from "../../../assets/pause.png";
import playImage from "../../../assets/play.png";
import previousChannelImage from "../../../assets/previousChannel.png";
import mutedImage from "../../../assets/volume-off.png";
import unmutedImage from "../../../assets/volume.png";
import { BaseComponent } from "../../base-component/base-component";
import { toComponent } from "../../base-component/class-to-component";

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

type DVBIPlayerControlsComponentData = {
	parentwidth: number;
	parentheight: number;
	playing: boolean;
	muted: boolean;
};
type ControlButtonNames =
	| "PreviousChannel"
	| "PlayPause"
	| "NextChannel"
	| "Mute";
export class DVBIPlayerControlsComponent extends BaseComponent<DVBIPlayerControlsComponentData> {
	static schema: Schema<DVBIPlayerControlsComponentData> = {
		parentwidth: { type: "number" },
		parentheight: { type: "number" },
		playing: { type: "boolean", default: true },
		muted: { type: "boolean", default: false },
	};
	private controlsUIHeight!: number;
	private buttonSize!: number;
	private controlButtons = new Map<
		ControlButtonNames,
		{
			entity: Entity;
			xPositionFactor: number;
		}
	>();

	public init() {
		this.onPreviousChannelClick = this.onPreviousChannelClick.bind(this);
		this.onPlayButtonClick = this.onPlayButtonClick.bind(this);
		this.onNextChannelClick = this.onNextChannelClick.bind(this);
		this.onMuteButtonClick = this.onMuteButtonClick.bind(this);
		this.updateComponentsSize();

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
		this.controlButtons.set("PreviousChannel", {
			entity: previousChannelButton,
			xPositionFactor: -2,
		});

		// create the play button
		const playButton = this.createControlButton(
			this.buttonSize,
			this.data.playing ? pauseImage : playImage,
			0,
			this.onPlayButtonClick
		);
		this.controlButtons.set("PlayPause", {
			entity: playButton,
			xPositionFactor: 0,
		});
		// create the next channel button
		const nextChannelButton = this.createControlButton(
			this.buttonSize,
			nextChannelImage,
			2 * this.buttonSize,
			this.onNextChannelClick
		);
		this.controlButtons.set("NextChannel", {
			entity: nextChannelButton,
			xPositionFactor: 2,
		});
		// create mute button
		const muteButton = this.createControlButton(
			this.buttonSize,
			this.data.muted ? mutedImage : unmutedImage,
			10 * this.buttonSize,
			this.onMuteButtonClick
		);

		this.controlButtons.set("Mute", {
			entity: muteButton,
			xPositionFactor: 10,
		});
	}

	public async update(oldData: DVBIPlayerControlsComponentData) {
		if (Object.keys(oldData).length === 0) {
			return;
		}

		if (this.data.muted !== oldData.muted) {
			const muteButton = this.controlButtons.get("Mute")!.entity;
			if (this.data.muted) {
				muteButton.setAttribute("src", mutedImage);
			} else {
				muteButton.setAttribute("src", unmutedImage);
			}
			this.el.emit("videoIsMuted", { videoIsMuted: this.data.muted }, false);
		}

		if (this.data.playing !== oldData.playing) {
			const playButton = this.controlButtons.get("PlayPause")!.entity;

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

		if (this.data.parentwidth !== oldData.parentheight) {
			this.updateComponentsSize();
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
		this.el.classList.add("raycastObject");
	}
	private createControlButton(
		buttonSize: number,
		image: string,
		xPosition: number,
		clickFunction: () => void
	) {
		const controlButton = document.createElement("a-image");
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
		this.el.setAttribute("playing", "" + this.data.playing);
	}
	private onPreviousChannelClick() {
		this.el.emit("previousChannel", undefined, false);
	}
	private onNextChannelClick() {
		this.el.emit("nextChannel", undefined, false);
	}
	private onMuteButtonClick() {
		this.el.setAttribute("muted", "" + this.data.playing);
	}
	private updateComponentsSize() {
		this.updateControlsUIHeight(this.data.parentheight);
		this.updateButtonSize(this.controlsUIHeight);
		this.create3DObject(this.data.parentwidth, this.controlsUIHeight);
		this.updatePosition(this.data.parentheight, this.controlsUIHeight);
		this.controlButtons.forEach((button) => {
			button.entity.setAttribute("width", "" + this.buttonSize);
			button.entity.setAttribute("height", "" + this.buttonSize);
			button.entity.setAttribute(
				"position",
				"" + this.buttonSize * button.xPositionFactor
			);
		});
	}

	private updateControlsUIHeight(parentHeight: number) {
		this.controlsUIHeight = parentHeight / 11;
	}
	private updateButtonSize(controlsUIHeight: number) {
		this.buttonSize = controlsUIHeight / 1.25;
	}
	private updatePosition(parentHeight: number, controlsUIHeight: number) {
		// set the controls position
		this.el.setAttribute(
			"position",
			`0 ${-(parentHeight / 2) + controlsUIHeight / 2} 0.01`
		);
	}
}

AFRAME.registerComponent(
	"dvbi-player-controls",
	toComponent(DVBIPlayerControlsComponent)
);
