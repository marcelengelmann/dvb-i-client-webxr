import { Schema } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";
import { DroppedEventData } from "../controls/dvb-i-controller";
import trash from "./model/trash.gltf";

AFRAME.registerPrimitive("a-dvb-i-trash-bin", {
	defaultComponents: {
		"dvb-i-trash-bin": {},
		position: { x: 0, y: 1.6, z: -2 },
	},
	mappings: {},
});

type DVBITrashBinData = {};

export class DVBITrashBin extends BaseComponent<DVBITrashBinData> {
	static schema: Schema<DVBITrashBinData> = {};

	public async init() {
		this.el.setAttribute("gltf-model", `url(${trash})`);

		this.el.classList.add("droppable");
		this.el.addEventListener("dropped", (event: Event) => {
			const eventData = (event as CustomEvent).detail as DroppedEventData;
			eventData.element.emit("removeElement");
			eventData.element.parentElement?.removeChild(eventData.element);
		});
	}
}

AFRAME.registerComponent("dvb-i-trash-bin", toComponent(DVBITrashBin));
