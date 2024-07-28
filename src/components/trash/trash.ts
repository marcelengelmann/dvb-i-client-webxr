import { Schema } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";
import { DroppedEventData } from "../controls/dvbi-controller";
import trash from "./model/trash.gltf";

AFRAME.registerPrimitive("a-dvbi-player-trash", {
	defaultComponents: {
		"dvbi-player-trash": {},
		position: { x: 0, y: 1.6, z: -2 },
	},
	mappings: {},
});

type TrashData = {};

export class Trash extends BaseComponent<TrashData> {
	static schema: Schema<TrashData> = {};

	public async init() {
		this.el.setAttribute("gltf-model", `url(${trash})`);

		this.el.classList.add("droppable");
		this.el.addEventListener("dropped", (event: Event) => {
			const eventData = (event as CustomEvent).detail as DroppedEventData;
			eventData.element.parentElement?.removeChild(eventData.element);
		});
	}
}

AFRAME.registerComponent("dvbi-player-trash", toComponent(Trash));
