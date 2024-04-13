import nextChannelImage from "./images/nextChannel.png";
import pauseImage from "./images/pause.png";
import playImage from "./images/play.png";
import previousChannelImage from "./images/previousChannel.png";

AFRAME.registerPrimitive("a-dvbi-player-controls", {
	defaultComponents: {
		"dvbi-player-controls": {},
	},
	mappings: {
		width: "dvbi-player-controls.width",
		height: "dvbi-player-controls.height",
	},
});
AFRAME.registerComponent("dvbi-player-controls", {
	schema: {
		parentWidth: { default: 16, min: 0 },
		parentHeight: { default: 9, min: 0 },
	},
	init: function () {
		this.videoIsPlaying = true;
		const controlsUIHeight = this.data.parentHeight / 11;
		const buttonSize = controlsUIHeight / 1.25;

		// Create plane to use for raycaster to show controls
		this.geometry = new AFRAME.THREE.PlaneGeometry(
			this.data.parentWidth,
			this.data.height
		);

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
		this.el.setAttribute(
			"position",
			`0 ${-(this.data.parentHeight / 2) + controlsUIHeight / 2} 0.01`
		);
		// only show controls, when looking at the bottom of the stream
		this.el.mater;
		this.el.addEventListener("mouseenter", () =>
			this.el.setAttribute("visible", true)
		);
		this.el.addEventListener("mouseleave", () =>
			this.el.setAttribute("visible", false)
		);
		this.el.setAttribute("visible", false);

		// create the previous channel button
		const previousChannelButton = this.createControlButton(
			buttonSize,
			previousChannelImage,
			-2 * buttonSize,
			this.onPreviousChannelClick
		);
		this.el.appendChild(previousChannelButton);

		// create the play button
		this.playButton = this.createControlButton(
			buttonSize,
			pauseImage,
			0,
			this.onPlayButtonClick
		);
		this.el.appendChild(this.playButton);
		// create the next channel button
		const nextChannelButton = this.createControlButton(
			buttonSize,
			nextChannelImage,
			2 * buttonSize,
			this.onNextChannelClick
		);
		this.el.appendChild(nextChannelButton);
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
		controlButton.addEventListener("click", clickFunction.bind(this));
		controlButton.classList.add("raycastObject");
		controlButton.setAttribute("src", image);
		return controlButton;
	},
	onPlayButtonClick: function () {
		this.videoIsPlaying = !this.videoIsPlaying;
		if (this.videoIsPlaying) {
			this.playButton.setAttribute("src", pauseImage);
			setTimeout(
				() => (this.playButton.getObject3D("mesh").material.alphaTest = 1),
				1
			);
		} else {
			this.playButton.setAttribute("src", playImage);
			setTimeout(
				() => (this.playButton.getObject3D("mesh").material.alphaTest = 1),
				1
			);
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
});
