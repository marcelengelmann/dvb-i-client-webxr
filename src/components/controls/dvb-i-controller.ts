import { Entity, Schema } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

type Point = {
	x: number;
	y: number;
	z: number;
};

export type GrabbingEndEventData = {
	dropped: boolean;
	element: Entity;
};

export type DroppedEventData = {
	element: Entity;
};

export type DVBIControllerComponentData = {
	grabstartevent?: string;
	grabendevent?: string;
	resizestartevent?: string;
	resizeendevent?: string;
};

export class DVBIControllerComponent extends BaseComponent<DVBIControllerComponentData> {
	static schema: Schema<DVBIControllerComponentData> = {
		grabstartevent: { type: "string", default: undefined },
		grabendevent: { type: "string", default: undefined },
		resizestartevent: { type: "string", default: undefined },
		resizeendevent: { type: "string", default: undefined },
	};
	private grabData?: {
		grabbed: Entity;
		grabbedParent: any;
		grapStartEvent: boolean;
	};

	private resizeData?: {
		intersectionPoint: Point;
		resizingElement: Entity;
		resizePlane: Entity;
		xFactor: number;
		zFactor: number;
		yFactor: number;
	};

	public init(): void {
		const raycasterObjects = [".clickable"];
		// Must maintain the order of applying resizing events before grabbing events
		if (this.data.resizestartevent && this.data.resizeendevent) {
			this.resizeStart = this.resizeStart.bind(this);
			this.resizeEnd = this.resizeEnd.bind(this);
			this.el.addEventListener(this.data.resizestartevent, this.resizeStart);
			this.el.addEventListener(this.data.resizeendevent, this.resizeEnd);
			raycasterObjects.push(".resizeHandler");
		} else if (
			(!this.data.resizestartevent && this.data.resizeendevent) ||
			(this.data.resizestartevent && !this.data.resizeendevent)
		) {
			console.error(
				"You must define resize events for both, the start and end of the resize action"
			);
		}

		if (this.data.grabstartevent && this.data.grabendevent) {
			this.grabStart = this.grabStart.bind(this);
			this.grabEnd = this.grabEnd.bind(this);
			this.el.addEventListener(this.data.grabstartevent, this.grabStart);
			this.el.addEventListener(this.data.grabendevent, this.grabEnd);
			raycasterObjects.push(".grabbable", ".droppable");
		} else if (
			(!this.data.grabstartevent && this.data.grabendevent) ||
			(this.data.grabstartevent && !this.data.grabendevent)
		) {
			console.error(
				"You must define grab events for both, the start and end of the grab action"
			);
		}
		this.el.setAttribute(
			"raycaster",
			`objects: ${raycasterObjects.join(", ")}`
		);
	}

	// Grab functions
	private grabStart(event: any): void {
		// don't start grabbing event, if already resizing (Resizing priority is higher than grabbing)
		if (this.resizeData || this.grabData) {
			return;
		}
		const element = getFirstIntersectionByClass(
			event.currentTarget.components["raycaster"].intersections,
			"grabbable"
		)?.element;

		if (!element) {
			return;
		}

		this.grabData = {
			grabbed: element,
			grabbedParent: element.object3D.parent,
			grapStartEvent: true,
		};
		element.emit("grabbing_start", undefined, false);
		this.el.sceneEl!.object3D.attach(element.object3D);

		this.el.object3D.attach(element.object3D);

		// remove grabStartEvent for the next js tick, so that the end event can be triggered
		// This is important, if e.g. the same event is used for the start and end of a grab action
		setTimeout(() => (this.grabData!.grapStartEvent = false), 1);
	}

	private grabEnd(event: any): void {
		if (!this.grabData || this.grabData.grapStartEvent) {
			return;
		}
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

	// resize functions
	private resizeStart(event: any): void {
		const intersection = getFirstIntersectionByClass(
			event.currentTarget.components["raycaster"].intersections,
			"resizeHandler"
		);
		const element = intersection?.element;

		if (!intersection || !element) {
			return;
		}

		// Create a plane to use for resizing intersection with the raycaster
		const geometry = new AFRAME.THREE.PlaneGeometry(200, 200);
		const material = new AFRAME.THREE.MeshStandardMaterial({
			opacity: 0,
			transparent: true,
		});
		const mesh = new AFRAME.THREE.Mesh(geometry, material);
		const resizePlane = document.createElement("a-entity");
		resizePlane.setObject3D("mesh", mesh);
		resizePlane.classList.add("resizeHandler");
		resizePlane.setAttribute("position", element.getAttribute("position"));
		resizePlane.setAttribute("rotation", element.getAttribute("rotation"));
		element.parentElement?.appendChild(resizePlane);

		let parent = element as Entity;
		while (parent !== undefined) {
			if (parent.classList.contains("resizeable")) {
				break;
			}
			parent = parent.parentElement as Entity;
		}
		const resizingElement = parent ?? element;

		const elementRotation = resizingElement.getAttribute("rotation");
		let yFactor = Math.abs(1 - (90 - elementRotation.z) / 90);
		let zFactor = Math.abs(1 - (90 - elementRotation.y) / 90);
		let xFactor = Math.max(0, 1 - zFactor - yFactor);

		const allAttribution = xFactor + yFactor + zFactor;

		xFactor /= allAttribution;
		yFactor /= allAttribution;
		zFactor /= allAttribution;

		this.resizeData = {
			intersectionPoint: intersection.point,
			resizingElement: resizingElement,
			resizePlane: resizePlane,
			xFactor: xFactor,
			yFactor: yFactor,
			zFactor: zFactor,
		};
	}
	public tick(): void {
		if (!this.resizeData) {
			return;
		}
		const intersection = getFirstIntersectionByClass(
			(this.el.components.raycaster as any).intersections,
			"resizeHandler"
		);
		if (!intersection) {
			return;
		}

		const resizeAmount =
			(this.resizeData.intersectionPoint.x - intersection.point.x) *
				this.resizeData.xFactor +
			(this.resizeData.intersectionPoint.y - intersection.point.y) *
				this.resizeData.yFactor +
			(intersection.point.z - this.resizeData.intersectionPoint.z) *
				this.resizeData.zFactor;

		if (resizeAmount === 0) {
			return;
		}

		this.resizeData.resizingElement.emit("resizeBy", -1 * resizeAmount);
		this.resizeData.intersectionPoint = intersection.point;
	}

	private resizeEnd(): void {
		this.resizeData?.resizePlane.parentElement?.removeChild(
			this.resizeData.resizePlane
		);
		this.resizeData = undefined;
	}
}

function getFirstIntersectionByClass(
	intersections: any[],
	className: string
):
	| {
			element: Entity;
			index: number;
			point: Point;
	  }
	| undefined {
	const objectIndex = intersections.findIndex((intersection) =>
		intersection.object.el.classList.contains(className)
	);
	if (objectIndex === -1) {
		return;
	}

	return {
		point: intersections[objectIndex].point,
		element: intersections[objectIndex].object.el,
		index: objectIndex,
	};
}

AFRAME.registerComponent(
	"dvb-i-controller",
	toComponent(DVBIControllerComponent)
);
