import { ChannelRegion } from "./channel-region.model";

export class ChannelList {
	constructor(
		public readonly name: string,
		public readonly providerName: string,
		public readonly defaultRegion: ChannelRegion | undefined,
		public readonly channelRegions: ChannelRegion[]
	) {}
}
