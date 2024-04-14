import nextChannelImage from "./images/nextChannel.png";
import pauseImage from "./images/pause.png";
import playImage from "./images/play.png";
import previousChannelImage from "./images/previousChannel.png";
import mutedImage from "./images/volume-off.png";
import unmutedImage from "./images/volume.png";

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
AFRAME.registerComponent("dvbi-player-controls", {
	schema: {
		parentwidth: { type: "number", min: 0 },
		parentheight: { type: "number", min: 0 },
		playing: { type: "boolean", default: true },
		muted: { type: "boolean", default: false },
	},
	init: function () {
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
	},
	createControlsPlane: function (
		width: number,
		height: number,
		position: string
	) {
		// Create plane to use for raycaster to show controls
		this.geometry = new AFRAME.THREE.PlaneGeometry(width, height);

		// Create material.
		this.material = new AFRAME.THREE.MeshStandardMaterial({
			opacity: 0,
			transparent: true,
		});

		// Create mesh.
		this.mesh = new AFRAME.THREE.Mesh(this.geometry, this.material);

		// Set mesh on entity.
		this.el.setObject3D("mesh", this.mesh);
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
	},
	createControlButton: function (
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
	},
	onPlayButtonClick: function () {
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
	},
	onPreviousChannelClick: function () {
		this.el.emit("previousChannel", undefined, false);
	},
	onNextChannelClick: function () {
		this.el.emit("nextChannel", undefined, false);
	},
	onMuteButtonClick: function () {
		this.videoIsMuted = !this.videoIsMuted;
		if (this.videoIsMuted) {
			this.muteButton.setAttribute("src", mutedImage);
		} else {
			this.muteButton.setAttribute("src", unmutedImage);
		}
		this.el.emit("videoIsMuted", { videoIsMuted: this.videoIsMuted }, false);
	},
});
