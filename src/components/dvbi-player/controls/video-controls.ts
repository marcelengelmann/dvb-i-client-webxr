import nextChannelImage from "./images/nextChannel.png";
import pauseImage from "./images/pause.png";
import playImage from "./images/play.png";
import previousChannelImage from "./images/previousChannel.png";

function init() {
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

			// set the controls position
			this.el.setAttribute(
				"position",
				`0 ${-(this.data.parentHeight / 2) + controlsUIHeight / 2} 0.01`
			);
			// only show controls, when looking at the bottom of the stream
			this.el.addEventListener("mouseenter", () =>
				this.el.setAttribute("visible", true)
			);
			this.el.addEventListener("mouseleave", () =>
				this.el.setAttribute("visible", false)
			);
			this.el.setAttribute("visible", false);

			// create the previous channel button
			const previousChannelButton = document.createElement("a-image");
			previousChannelButton.setAttribute("width", buttonSize);
			previousChannelButton.setAttribute("height", buttonSize);
			previousChannelButton.setAttribute("position", `${-2 * buttonSize} 0 0`);
			previousChannelButton.addEventListener(
				"click",
				this.onPreviousChannelClick.bind(this)
			);
			previousChannelButton.setAttribute("src", previousChannelImage);
			this.el.appendChild(previousChannelButton);

			// create the next channel button
			const nextChannelButton = document.createElement("a-image");
			nextChannelButton.setAttribute("width", buttonSize);
			nextChannelButton.setAttribute("height", buttonSize);
			nextChannelButton.setAttribute("position", `${2 * buttonSize} 0 0`);
			nextChannelButton.addEventListener(
				"click",
				this.onNextChannelClick.bind(this)
			);
			nextChannelButton.setAttribute("src", nextChannelImage);
			this.el.appendChild(nextChannelButton);

			// create the play button
			this.playButton = document.createElement("a-image");
			this.playButton.setAttribute("width", buttonSize);
			this.playButton.setAttribute("height", buttonSize);
			this.playButton.addEventListener(
				"click",
				this.onPlayButtonClick.bind(this)
			);
			this.playButton.setAttribute("src", pauseImage);
			this.el.appendChild(this.playButton);
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
}
const VideoControls = {
	init: () => init(),
};

export { VideoControls };
