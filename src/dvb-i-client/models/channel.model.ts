export class Channel {
	constructor(
		public readonly name: string,
		public readonly providerName: string,
		public readonly uniqueIdentifier: string,
		public readonly dashStreamUrl?: string,
		public readonly channelImageUrl?: string
	) {}
}
