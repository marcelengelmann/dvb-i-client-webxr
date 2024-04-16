import { BaseComponent } from "../BaseComponent/base-component";
import { toComponent } from "../BaseComponent/to-component";

export class GrabberComponent extends BaseComponent {
	grabbed: any;
	events = {
		gripdown(this: GrabberComponent, event: any): void {
			if (
				event.currentTarget.components["raycaster"].intersections.length > 0
			) {
				this.grabbed =
					event.currentTarget.components[
						"raycaster"
					].intersections[0].object.el;
				console.log(this.grabbed);

				this.grabbed.emit("grabbing_start", undefined, false);
				event.currentTarget.object3D.attach(this.grabbed.object3D);
			}
		},
		gripup(this: GrabberComponent): void {
			if (this.grabbed) {
				this.el.sceneEl!.object3D.attach(this.grabbed.object3D);
				this.grabbed.emit("grabbing_end", undefined, false);
				this.grabbed = undefined;
			}
		},
	};
}

AFRAME.registerComponent("grabber", toComponent(GrabberComponent));
