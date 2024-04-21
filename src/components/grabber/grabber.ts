import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

export class GrabberComponent extends BaseComponent {
	private grabbed: any;
	private grabbedParent: any;

	public init(): void {
		this.grabStart = this.grabStart.bind(this);
		this.grabEnd = this.grabEnd.bind(this);
		this.el.addEventListener("gripdown", this.grabStart);
		this.el.addEventListener("gripup", this.grabEnd);
	}
	private grabStart(event: any): void {
		if (event.currentTarget.components["raycaster"].intersections.length > 0) {
			this.grabbed =
				event.currentTarget.components["raycaster"].intersections[0].object.el;
			this.grabbedParent = this.grabbed.object3D.parent;
			this.grabbed.emit("grabbing_start", undefined, false);
			event.currentTarget.object3D.attach(this.grabbed.object3D);
		}
	}
	private grabEnd(): void {
		if (this.grabbed) {
			if (this.grabbedParent) {
				this.grabbedParent.attach(this.grabbed.object3D);
			} else {
				this.el.sceneEl!.object3D.attach(this.grabbed.object3D);
			}
			this.grabbed.emit("grabbing_end", undefined, false);
			this.grabbed = undefined;
			this.grabbedParent = undefined;
		}
	}
}

AFRAME.registerComponent("grabber", toComponent(GrabberComponent));
