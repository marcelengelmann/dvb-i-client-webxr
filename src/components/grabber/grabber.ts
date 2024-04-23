import { Entity } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

export type GrabbingEndEventData = {
	dropped: boolean;
	element: Entity;
};

export type DroppedEventData = {
	element: Entity;
};

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
		const intersectionElement = getFirstIntersectionByClass(
			event.currentTarget.components["raycaster"].intersections,
			"grabbable"
		);
		if (intersectionElement) {
			this.grabbed = intersectionElement;
			this.grabbedParent = this.grabbed.object3D.parent;
			this.grabbed.emit("grabbing_start", undefined, false);
			event.currentTarget.object3D.attach(this.grabbed.object3D);
		}
	}
	private grabEnd(event: any): void {
		if (this.grabbed) {
			if (this.grabbedParent) {
				this.grabbedParent.attach(this.grabbed.object3D);
			} else {
				this.el.sceneEl!.object3D.attach(this.grabbed.object3D);
			}
			const intersectionElement = getFirstIntersectionByClass(
				event.currentTarget.components["raycaster"].intersections,
				"droppable"
			);
			let dropped = false;
			if (intersectionElement && intersectionElement !== this.grabbed) {
				const dropEventData: DroppedEventData = {
					element: this.grabbed,
				};
				intersectionElement.emit("dropped", dropEventData, false);
				dropped = true;
			}
			const grabbingEndEventData: GrabbingEndEventData = {
				dropped: dropped,
				element: this.grabbed,
			};
			this.grabbed.emit("grabbing_end", grabbingEndEventData, false);
			this.grabbed = undefined;
			this.grabbedParent = undefined;
		}
	}
}

function getFirstIntersectionByClass(
	intersections: any[],
	className: string
): Entity | undefined {
	return intersections.find((intersection) =>
		intersection.object.el.classList.contains(className)
	)?.object.el;
}

AFRAME.registerComponent("grabber", toComponent(GrabberComponent));
