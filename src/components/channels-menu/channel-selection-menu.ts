import { Schema } from "aframe";
import { BaseComponent } from "../base-component/base-component";
import { toComponent } from "../base-component/class-to-component";

AFRAME.registerPrimitive("a-dvbi-player-channel-selection-menu", {
	defaultComponents: {
		"dvbi-player-channel-selection-menu": {},
	},
	mappings: {},
});

type ChannelsSelectionMenuData = {};

export class ChannelSelectionMenuComponent extends BaseComponent<ChannelsSelectionMenuData> {
	static schema: Schema<ChannelsSelectionMenuData> = {};
	// private channelList!: Channels;
	// private channelIndex = 0;
	public async init() {
		//this.channelList = await DVBI_CLIENT.getDefaultChannels();
	}
}

AFRAME.registerComponent(
	"dvbi-player-channel-selection-menu",
	toComponent(ChannelSelectionMenuComponent)
);
