import { Schema } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";
import { DroppedEventData } from "../controls/dvb-i-controller";
import trash from "./model/trash.gltf";

AFRAME.registerPrimitive("a-dvb-i-video-player-trash-bin", {
	defaultComponents: {
		"dvb-i-video-player-trash": {},
		position: { x: 0, y: 1.6, z: -2 },
	},
	mappings: {},
});

type TrashBinData = {};

export class TrashBin extends BaseComponent<TrashBinData> {
	static schema: Schema<TrashBinData> = {};

	public async init() {
		this.el.setAttribute("gltf-model", `url(${trash})`);

		this.el.classList.add("droppable");
		this.el.addEventListener("dropped", (event: Event) => {
			const eventData = (event as CustomEvent).detail as DroppedEventData;
			eventData.element.parentElement?.removeChild(eventData.element);
		});
	}
}

AFRAME.registerComponent("dvb-i-video-player-trash", toComponent(TrashBin));
