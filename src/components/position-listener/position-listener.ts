import { Entity } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

export class CameraPositionListener extends BaseComponent {
	private lastValue: string = "";
	private camera!: Entity;
	public init() {
		this.camera = document.getElementById("camera") as Entity;
	}

	public tick() {
		const newValue = this.camera.getAttribute("position")!;
		const stringCoords = AFRAME.utils.coordinates.stringify(newValue);
		if (this.lastValue !== stringCoords) {
			this.el.emit("cameraPositionChanged", newValue);
			this.lastValue = stringCoords;
		}
	}
}

AFRAME.registerComponent(
	"camera-position-listener",
	toComponent(CameraPositionListener)
);
