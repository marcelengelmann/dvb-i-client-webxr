import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

export class PositionListenerComponent extends BaseComponent {
	private lastValue: string = "";
	tick() {
		const newValue = this.el.getAttribute("position");
		const stringCoords = AFRAME.utils.coordinates.stringify(newValue);
		if (this.lastValue !== stringCoords) {
			this.el.emit("positionChanged", newValue);
			this.lastValue = stringCoords;
		}
	}
}

AFRAME.registerComponent(
	"position-listener",
	toComponent(PositionListenerComponent)
);
