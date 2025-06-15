import { ChannelList } from "../models/channel-list.model";
import { ChannelRegion } from "../models/channel-region.model";
import { Channel } from "../models/channel.model";
import {
	LCNTable,
	Region,
	Service,
	ServiceList,
} from "../models/service-list-backend-data.model";

function mapServiceListToChannelList(serviceList: ServiceList): ChannelList {
	const channels = getChannels(serviceList);
	const channelRegions = getChannelRegions(
		serviceList.RegionList.Region,
		serviceList.LCNTableList.LCNTable,
		channels
	);
	const defaultChannelRegion = getDefaultChannelRegion(
		serviceList.LCNTableList.LCNTable,
		channels
	);
	const channelList = new ChannelList(
		serviceList.Name,
		serviceList.ProviderName,
		defaultChannelRegion,
		channelRegions
	);
	return channelList;
}

function getChannels(serviceList: ServiceList): Channel[] {
	const channels: Channel[] = [];

	for (const service of serviceList.Service) {
		const channelImageUrl = getChannelImageUrl(service);
		const channelDashUrl = getChannelDashUrl(service);

		const channel = new Channel(
			service.ServiceName,
			service.ProviderName,
			service.UniqueIdentifier,
			channelDashUrl,
			channelImageUrl
		);
		channels.push(channel);
	}

	return channels;
}

function getChannelImageUrl(service: Service): string | undefined {
	const relatedMaterials = Array.isArray(service.RelatedMaterial)
		? service.RelatedMaterial
		: [service.RelatedMaterial];
	return relatedMaterials.find(
		(related) =>
			related.MediaLocator["tva:MediaUri"] &&
			related.MediaLocator["tva:MediaUri"].$.contentType.includes("image/")
	)?.MediaLocator?.["tva:MediaUri"]._;
}

function getChannelDashUrl(service: Service): string | undefined {
	const serviceInstance = Array.isArray(service.ServiceInstance)
		? service.ServiceInstance
		: [service.ServiceInstance];
	return serviceInstance.find(
		(instance) => instance.DASHDeliveryParameters !== undefined
	)?.DASHDeliveryParameters?.UriBasedLocation.URI;
}

function getChannelRegions(
	regions: Region[],
	lcnTables: LCNTable[],
	channels: Channel[]
): ChannelRegion[] {
	const channelRegions: ChannelRegion[] = [];
	for (const region of regions) {
		const channelRegion = new ChannelRegion(
			region.$.regionID,
			region.RegionName
		);
		channelRegions.push(channelRegion);

		const lcnTableRegion = lcnTables.find(
			(table) => table.TargetRegion?.localeCompare(region.$.regionID) === 0
		);
		if (!lcnTableRegion) {
			continue;
		}
		addChannelsToRegion(channelRegion, channels, lcnTableRegion);
	}

	return channelRegions;
}

function getDefaultChannelRegion(
	lcnTables: LCNTable[],
	channels: Channel[]
): ChannelRegion | undefined {
	const defaultLCNTable = lcnTables.find(
		(table) => table.TargetRegion === undefined
	);
	if (defaultLCNTable === undefined) {
		return;
	}

	const defaultChannelRegion = new ChannelRegion("", "");
	addChannelsToRegion(defaultChannelRegion, channels, defaultLCNTable);

	return defaultChannelRegion;
}

function addChannelsToRegion(
	channelRegion: ChannelRegion,
	channels: Channel[],
	lcnTableRegion: LCNTable
) {
	for (const lcn of lcnTableRegion.LCN) {
		const channel = channels.find(
			(channel) =>
				channel.uniqueIdentifier.localeCompare(lcn.$.serviceRef) === 0
		);
		if (!channel) {
			continue;
		}
		channelRegion.addChannel(channel, +lcn.$.channelNumber);
	}

	channelRegion.getChannels().sort((a, b) => a.channelNumber - b.channelNumber);
}

export { mapServiceListToChannelList };
