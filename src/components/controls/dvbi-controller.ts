import { Entity, Schema } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

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
		resizingElement: Entity;
		position: { x: number; y: number; z: number };
		xFactor: number;
		zFactor: number;
		yFactor: number;
	};

	public init(): void {
		const raycasterObjects = [".clickable"];
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
		this.el.setAttribute(
			"raycaster",
			`objects: ${raycasterObjects.join(", ")}`
		);
	}

	// Grab functions
	private grabStart(event: any): void {
		const element = getFirstIntersectionByClass(
			event.currentTarget.components["raycaster"].intersections,
			"grabbable"
		)?.element;

		if (!element || this.grabData) {
			return;
		}

		this.grabData = {
			grabbed: element,
			grabbedParent: element.object3D.parent,
			grapStartEvent: true,
		};
		element.emit("grabbing_start", undefined, false);
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
		const element = getFirstIntersectionByClass(
			event.currentTarget.components["raycaster"].intersections,
			"grabbable"
		)?.element;

		if (!element) {
			return;
		}
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
