import { Channel } from "./channel.model";

export type Channels = { channelNumber: number; channel: Channel }[];

export class ChannelRegion {
	private readonly channels: Channels = [];
	constructor(
		public readonly regionId: string,
		public readonly regionName: string
	) {}

	public getChannels(): Channels {
		return this.channels;
	}

	public getChannel(channelNumber: number): Channel | undefined {
		return this.channels.find((ch) => ch.channelNumber === channelNumber)
			?.channel;
	}

	public addChannel(channel: Channel, channelNumber: number): void {
		if (this.getChannel(channelNumber)) {
			console.error(
				"No duplicated channelNumbers allowed",
				channel,
				channelNumber
			);
		}
		this.channels.push({ channel: channel, channelNumber: channelNumber });
	}
}
