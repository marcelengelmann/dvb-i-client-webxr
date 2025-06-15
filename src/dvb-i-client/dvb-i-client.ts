import xml2js from "xml2js";
import { mapServiceListToChannelList } from "./mappers/service-list-to-channel-list.mapper";
import { ChannelList } from "./models/channel-list.model";
import { Channels } from "./models/channel-region.model";
import { ServiceList } from "./models/service-list-backend-data.model";

export class DVBIClient {
	private channelList: ChannelList | undefined;
	constructor(private serviceListUrl: string) {
	}

	public async getDefaultChannels(refetch: boolean = false): Promise<Channels> {
		const channelList = await this.retrieveChannelList(refetch);
		if (channelList === null || channelList.defaultRegion === undefined) {
			return [];
		}

		return channelList.defaultRegion.getChannels();
	}

	public async getChannelsByRegion(
		regionId: string,
		refetch: boolean = false
	): Promise<Channels> {
		const channelList = await this.retrieveChannelList(refetch);

		const region = channelList?.channelRegions.find(
			(region) => region.regionId === regionId
		);

		return region?.getChannels() ?? [];
	}

	public async getRegionIds(refetch: boolean = false): Promise<string[]> {
		const channelList = await this.retrieveChannelList(refetch);
		if (channelList === null) {
			return [];
		}

		return channelList.channelRegions.map((region) => region.regionId);
	}

	private async retrieveChannelList(
		refetch: boolean
	): Promise<ChannelList | null> {
		if (this.channelList !== undefined && !refetch) {
			return this.channelList;
		}
		try {
			const response = await fetch(this.serviceListUrl);
			const data = await response.text();
			const parser = new xml2js.Parser({ explicitArray: false });
			const res = await parser.parseStringPromise(data);

			const serviceList = res.ServiceList as ServiceList;

			this.channelList = mapServiceListToChannelList(serviceList);
			return this.channelList;
		} catch (e) {
			// TODO: error handling
			console.error(e);
			return null;
		}
	}
}
