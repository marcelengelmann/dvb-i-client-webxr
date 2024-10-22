import { Entity, Schema } from "aframe";
import { Channels } from "../../dvb-i-client/models/channel-region.model";
import { DVBI_CLIENT } from "../../main";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

import { getCorsProxyUrl } from "../../utils/corsproxy";
import { GrabbingEndEventData } from "../controls/dvb-i-controller";
import nextChannelButton from "/src/assets/nextChannel.png";
import previousChannelButton from "/src/assets/previousChannel.png";

AFRAME.registerPrimitive("a-dvb-i-channels-menu", {
	defaultComponents: {
		"dvb-i-channels-menu": {},
		position: { x: 0, y: 1.6, z: -2 },
	},
	mappings: {
		width: "dvb-i-channels-menu.width",
		backgroundcolor: "dvb-i-channels-menu.backgroundcolor",
		textcolor: "dvb-i-channels-menu.textcolor",
	},
});

type DVBIChannelsMenuData = {
	width: number;
	backgroundcolor: string;
	textcolor: string;
};

export class DVBIChannelsMenuComponent extends BaseComponent<DVBIChannelsMenuData> {
	static schema: Schema<DVBIChannelsMenuData> = {
		width: { type: "number", default: 1 },
		backgroundcolor: { type: "string", default: "gray" },
		textcolor: { type: "string", default: "black" },
	};
	private channelList!: Channels;
	private channelIndex = 0; // array index of channels
	private channelNumber!: number; // actual channel number as in dvbi
	private material: any;
	private channelImageElement!: Entity;
	private channelNameElement!: Entity;
	private channelNumberElement!: Entity;
	private previousChannelButton!: Entity;
	private nextChannelButton!: Entity;
	private grabbableChannelElement!: Entity;

	public async init() {
		this.channelList = await DVBI_CLIENT.getDefaultChannels();
		// Create a 3D Object that is hittable by the raycaster
		const geometry = new AFRAME.THREE.PlaneGeometry(1, 1);

		const material = new AFRAME.THREE.MeshStandardMaterial({
			color: this.data.backgroundcolor,
			side: 2, // double side
		});
		const mesh = new AFRAME.THREE.Mesh(geometry, material);
		this.el.setObject3D("mesh", mesh);
		this.material = material;

		this.createComponentElements();
	}

	public update(oldData: DVBIChannelsMenuData): void {
		if (Object.keys(oldData).length === 0) {
			return;
		}

		const updateWidth = this.data.width !== oldData.width;

		if (updateWidth) {
			this.el.object3D.scale.set(this.data.width, this.data.width, 1);
		}
		if (this.data.backgroundcolor !== oldData.backgroundcolor) {
			this.material.color.set(this.data.backgroundcolor);
		}

		this.updateComponentElements(
			updateWidth,
			this.data.textcolor !== oldData.textcolor,
			false
		);
	}

	private createComponentElements(): void {
		this.channelImageElement = document.createElement("a-image");
		this.channelImageElement.setAttribute("position", "0 0.25 0.01");

		this.channelNameElement = document.createElement("a-text");
		this.channelNameElement.setAttribute("align", "center");
		this.channelNameElement.setAttribute("position", "0 -0.08 0.01");

		this.channelNumberElement = document.createElement("a-text");
		this.channelNumberElement.setAttribute("align", "center");
		this.channelNumberElement.setAttribute("position", "0 -0.3 0.01");

		this.previousChannelButton = document.createElement("a-image");
		this.previousChannelButton.setAttribute("position", "-0.2 -0.3 0.01");
		this.previousChannelButton.setAttribute("src", previousChannelButton);
		this.previousChannelButton.classList.add("clickable");

		this.nextChannelButton = document.createElement("a-image");
		this.nextChannelButton.setAttribute("position", "0.2 -0.3 0.01");
		this.nextChannelButton.setAttribute("src", nextChannelButton);
		this.nextChannelButton.classList.add("clickable");

		this.grabbableChannelElement = document.createElement("a-image");
		this.grabbableChannelElement.setAttribute("position", "0 0.25 -0.01");
		this.grabbableChannelElement.setAttribute("visible", "false");
		this.grabbableChannelElement.classList.add("grabbable");

		this.el.appendChild(this.channelImageElement);
		this.el.appendChild(this.channelNameElement);
		this.el.appendChild(this.channelNumberElement);
		this.el.appendChild(this.previousChannelButton);
		this.el.appendChild(this.nextChannelButton);
		this.el.appendChild(this.grabbableChannelElement);

		this.previousChannelButton.addEventListener("click", () => {
			if (this.channelIndex === 0) {
				this.channelIndex = this.channelList.length;
			}
			this.channelIndex--;
			this.updateComponentElements(false, false, true);
		});

		this.nextChannelButton.addEventListener("click", () => {
			this.channelIndex++;
			if (this.channelIndex === this.channelList.length) {
				this.channelIndex = 0;
			}
			this.updateComponentElements(false, false, true);
		});

		this.grabbableChannelElement.addEventListener("grabbing_start", () => {
			this.grabbableChannelElement.setAttribute("visible", "true");
		});

		this.grabbableChannelElement.addEventListener(
			"grabbing_end",
			(event: Event) => {
				const eventData = (event as CustomEvent).detail as GrabbingEndEventData;
				this.grabbableChannelElement.setAttribute("visible", "false");

				if (!eventData.dropped) {
					// grabbed element was not dropped onto another element in the scene
					const newPlayer = document.createElement("a-dvb-i-video-player");
					const worldPos = new AFRAME.THREE.Vector3();
					worldPos.setFromMatrixPosition(
						this.grabbableChannelElement.object3D.matrixWorld
					);
					const rotationGrabbedElement =
						this.grabbableChannelElement.getAttribute("rotation");
					newPlayer.setAttribute("position", worldPos);
					newPlayer.setAttribute("channelnumber", this.channelNumber);
					newPlayer.setAttribute("rotation", rotationGrabbedElement);
					const scene = document.getElementById("scene");
					scene!.appendChild(newPlayer);
				}

				this.grabbableChannelElement.setAttribute(
					"position",
					this.channelImageElement.getAttribute("position")
				);
				this.grabbableChannelElement.setAttribute(
					"rotation",
					this.channelImageElement.getAttribute("rotation")
				);
			}
		);

		this.updateComponentElements(true, true, true);
	}

	private updateComponentElements(
		updateWidth: boolean,
		updateTextColor: boolean,
		updateChannel: boolean
	): void {
		if (updateWidth) {
			this.channelImageElement.setAttribute("width", this.data.width * 0.8);
			this.channelImageElement.setAttribute(
				"height",
				(this.data.width * 0.8) / (16 / 9)
			);
			this.grabbableChannelElement.setAttribute("width", this.data.width * 0.8);
			this.grabbableChannelElement.setAttribute(
				"height",
				(this.data.width * 0.8) / (16 / 9)
			);
			this.channelNameElement.setAttribute("width", this.data.width);
			this.channelNumberElement.setAttribute("width", this.data.width);
			this.previousChannelButton.setAttribute("width", this.data.width * 0.15);
			this.previousChannelButton.setAttribute("height", this.data.width * 0.15);
			this.nextChannelButton.setAttribute("width", this.data.width * 0.15);
			this.nextChannelButton.setAttribute("height", this.data.width * 0.15);
		}
		if (updateTextColor) {
			this.channelNameElement.setAttribute("color", this.data.textcolor);
			this.channelNumberElement.setAttribute("color", this.data.textcolor);
		}
		if (updateChannel) {
			const channelElement = this.channelList[this.channelIndex];
			this.channelNumber = channelElement.channelNumber;
			this.channelImageElement.setAttribute(
				"src",
				getCorsProxyUrl(channelElement.channel.channelImageUrl!)
			);
			this.grabbableChannelElement.setAttribute(
				"src",
				getCorsProxyUrl(channelElement.channel.channelImageUrl!)
			);
			(this.grabbableChannelElement as any).channelNumber =
				channelElement.channelNumber;
			this.channelNameElement.setAttribute(
				"value",
				channelElement.channel.name
			);
			this.channelNumberElement.setAttribute("value", "#" + this.channelNumber);
		}
	}
}

AFRAME.registerComponent(
	"dvb-i-channels-menu",
	toComponent(DVBIChannelsMenuComponent)
);
