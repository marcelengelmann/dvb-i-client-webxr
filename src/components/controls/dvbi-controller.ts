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

export class DVBIControllerComponent extends BaseComponent {
	private grabData?: {
		grabbed: Entity;
		grabbedParent: any;
	};

	private resizeData?: {
		resizingElement: Entity;
		position: { x: number; y: number; z: number };
		xFactor: number;
		zFactor: number;
		yFactor: number;
	};

	public init(): void {
		this.gripDown = this.gripDown.bind(this);
		this.gripUp = this.gripUp.bind(this);
		this.el.addEventListener("gripdown", this.gripDown);
		this.el.addEventListener("gripup", this.gripUp);
	}

	// general functions
	private gripDown(event: any): void {
		const grabElement = getFirstIntersectionByClass(
			event.currentTarget.components["raycaster"].intersections,
			"grabbable"
		);
		const resizeElement = getFirstIntersectionByClass(
			event.currentTarget.components["raycaster"].intersections,
			"resizeHandler"
		);

		if (!grabElement && !resizeElement) {
			return;
		}
		if (grabElement && !resizeElement) {
			this.grabStart(grabElement.element);
			return;
		}

		if (!grabElement && resizeElement) {
			this.resizeStart(resizeElement.element);
			return;
		}
		if (grabElement!.index < resizeElement!.index) {
			this.grabStart(grabElement!.element);
			return;
		}
		// else
		this.resizeStart(resizeElement!.element);
		return;
	}
	private gripUp(event: any): void {
		if (this.grabData) {
			this.grabEnd(event);
		}
		if (this.resizeData) {
			this.resizeEnd();
		}
	}

	// Grab functions
	private grabStart(element: Entity): void {
		this.grabData = {
			grabbed: element,
			grabbedParent: element.object3D.parent,
		};
		element.emit("grabbing_start", undefined, false);
		this.el.object3D.attach(element.object3D);
	}

	private grabEnd(event: any): void {
		if (this.grabData) {
			const { grabbed, grabbedParent } = this.grabData;
			if (grabbedParent) {
				grabbedParent.attach(grabbed.object3D);
			} else {
				this.el.sceneEl!.object3D.attach(grabbed.object3D);
			}
			const intersectionElement = getFirstIntersectionByClass(
				event.currentTarget.components["raycaster"].intersections,
				"droppable"
			);
			let dropped = false;
			if (intersectionElement && intersectionElement.element !== grabbed) {
				const dropEventData: DroppedEventData = {
					element: grabbed,
				};
				intersectionElement.element.emit("dropped", dropEventData, false);
				dropped = true;
			}
			const grabbingEndEventData: GrabbingEndEventData = {
				dropped: dropped,
				element: grabbed,
			};
			grabbed.emit("grabbing_end", grabbingEndEventData, false);
			this.grabData = undefined;
		}
	}

	// resize functions
	private resizeStart(element: Entity): void {
		let parent = element as Entity;
		while (parent !== undefined) {
			if (parent.classList.contains("resizeable")) {
				break;
			}
			parent = parent.parentElement as Entity;
		}
		const resizingElement = parent ?? element;
		const position = this.el.object3D.position.clone();
		// rotation = el.object3D.rotation.clone();
		const elementRotation = resizingElement.getAttribute("rotation");
		// can't grab elements from behind
		let yFactor = Math.abs(1 - (90 - elementRotation.z) / 90);
		let zFactor = Math.abs(1 - (90 - elementRotation.y) / 90);
		let xFactor = Math.max(0, 1.5 - zFactor - yFactor);

		const allAttribution = xFactor + yFactor + zFactor;

		xFactor /= allAttribution;
		yFactor /= allAttribution;
		zFactor /= allAttribution;
		this.resizeData = {
			position: position,
			xFactor: xFactor,
			yFactor: yFactor,
			zFactor: zFactor,
			resizingElement: resizingElement,
		};
	}
	public tick(): void {
		if (!this.resizeData) {
			return;
		}
		const position = this.el.object3D.position.clone();
		// const rotation = this.el.object3D.rotation.clone();
		const resizeAmount =
			(this.resizeData.position.x -
				position.x) /*+ (this.rotation.x - rotation.x)*/ *
				this.resizeData.xFactor +
			(this.resizeData.position.y -
				position.y) /*+ (this.rotation.y - rotation.y)*/ *
				this.resizeData.yFactor +
			(position.z -
				this.resizeData.position.z) /*+ (this.rotation.z - rotation.z)*/ *
				this.resizeData.zFactor;
		if (resizeAmount !== 0) {
			this.resizeData.resizingElement.emit("resizeBy", resizeAmount);
		}
		this.resizeData.position = position;
		// this.rotation = rotation;
	}

	private resizeEnd(): void {
		this.resizeData = undefined;
	}
}

function getFirstIntersectionByClass(
	intersections: any[],
	className: string
): { element: Entity; index: number } | undefined {
	const objectIndex = intersections.findIndex((intersection) =>
		intersection.object.el.classList.contains(className)
	);
	if (objectIndex === -1) {
		return;
	}

	return {
		element: intersections[objectIndex].object.el,
		index: objectIndex,
	};
}

AFRAME.registerComponent(
	"dvbi-controller",
	toComponent(DVBIControllerComponent)
);
