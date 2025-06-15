export interface ServiceList {
	$: _;
	Name: string;
	ProviderName: string;
	RegionList: RegionList;
	LCNTableList: LCNTableList;
	ContentGuideSourceList: ContentGuideSourceList;
	Service: Service[];
}

export interface Service {
	$: _8;
	UniqueIdentifier: string;
	ServiceInstance:
		| ServiceInstance[]
		| ServiceInstance2
		| ServiceInstance3[]
		| ServiceInstance4
		| ServiceInstance5
		| ServiceInstance6[]
		| ServiceInstance7[]
		| ServiceInstance8[]
		| ServiceInstance9[]
		| ServiceInstance10[]
		| ServiceInstance11[]
		| ServiceInstance12[];
	ServiceName: string;
	ProviderName: string;
	RelatedMaterial: RelatedMaterial[] | RelatedMaterial;
	ServiceType: HowRelated;
	ContentGuideSourceRef?: string;
	ContentGuideServiceRef?: string;
	ServiceGenre?: HowRelated;
	RecordingInfo?: HowRelated;
}

export interface ServiceInstance12 {
	$: _9;
	DVBCDeliveryParameters?: DVBCDeliveryParameters;
	RelatedMaterial?: RelatedMaterial;
	DASHDeliveryParameters?: DASHDeliveryParameters;
}

export interface ServiceInstance11 {
	$: _9;
	DisplayName: string;
	DVBSDeliveryParameters?: DVBSDeliveryParameters2;
	SATIPDeliveryParameters?: SATIPDeliveryParameters;
	DVBCDeliveryParameters?: DVBCDeliveryParameters2;
	DVBTDeliveryParameters?: DVBTDeliveryParameters;
	DASHDeliveryParameters?: DASHDeliveryParameters;
	OtherDeliveryParameters?: OtherDeliveryParameters;
}

export interface OtherDeliveryParameters {
	$: _14;
	"hls:UriBasedLocation"?: ScheduleInfoEndpoint;
	HLSUrl?: ScheduleInfoEndpoint;
}

export interface _14 {
	extensionName: string;
	"xsi:type"?: string;
}

export interface ServiceInstance10 {
	$: _9;
	DisplayName: string;
	DVBSDeliveryParameters?: DVBSDeliveryParameters2;
	SATIPDeliveryParameters?: SATIPDeliveryParameters;
	DVBCDeliveryParameters?: DVBCDeliveryParameters2;
	DVBTDeliveryParameters?: DVBTDeliveryParameters;
	DASHDeliveryParameters?: DASHDeliveryParameters;
}

export interface DVBCDeliveryParameters2 {
	DVBTriplet: DVBTriplet;
	TargetCountry: string;
	NetworkID: string;
}

export interface SATIPDeliveryParameters {
	QueryParameters: string;
}

export interface DVBSDeliveryParameters2 {
	DVBTriplet: DVBTriplet;
	OrbitalPosition: string;
	Frequency: string;
	Polarization: string;
}

export interface ServiceInstance9 {
	$: _9;
	DASHDeliveryParameters?: DASHDeliveryParameters;
	DVBSDeliveryParameters?: DVBSDeliveryParameters;
	DVBTDeliveryParameters?: DVBTDeliveryParameters;
}

export interface ServiceInstance8 {
	$: _9;
	DASHDeliveryParameters?: DASHDeliveryParameters;
	DVBSDeliveryParameters?: DVBSDeliveryParameters;
}

export interface ServiceInstance7 {
	$: _9;
	RelatedMaterial?: RelatedMaterial;
	DASHDeliveryParameters?: DASHDeliveryParameters;
	DisplayName?: string;
	DVBCDeliveryParameters?: DVBCDeliveryParameters;
}

export interface ServiceInstance6 {
	$: _9;
	ContentAttributes?: ContentAttributes;
	DASHDeliveryParameters?: DASHDeliveryParameters;
	DVBSDeliveryParameters?: DVBSDeliveryParameters;
}

export interface ContentAttributes {
	AudioAttributes: AudioAttributes;
}

export interface AudioAttributes {
	"tva:Coding": HowRelated;
}

export interface ServiceInstance5 {
	$: _9;
	DisplayName: string;
	RelatedMaterial: RelatedMaterial[];
	Availability: Availability;
	DASHDeliveryParameters: DASHDeliveryParameters;
}

export interface Availability {
	Period: Period[];
}

export interface Period {
	Interval: Interval;
}

export interface Interval {
	$: _13;
}

export interface _13 {
	startTime: string;
	endTime: string;
	days: string;
}

export interface ServiceInstance4 {
	$: _9;
	DASHDeliveryParameters: DASHDeliveryParameters;
}

export interface ServiceInstance3 {
	$: _9;
	RelatedMaterial?: RelatedMaterial;
	DASHDeliveryParameters?: DASHDeliveryParameters;
	DVBCDeliveryParameters?: DVBCDeliveryParameters;
	DVBSDeliveryParameters?: DVBSDeliveryParameters;
}

export interface DVBCDeliveryParameters {
	DVBTriplet: DVBTriplet2;
	TargetCountry: string;
	NetworkID: string;
}

export interface DVBTriplet2 {
	$: _12;
}

export interface _12 {
	origNetId?: string;
	serviceId: string;
	tsId: string;
}

export interface RelatedMaterial {
	HowRelated: HowRelated;
	MediaLocator: MediaLocator;
}

export interface MediaLocator {
	"tva:MediaUri": TvaMediaUri;
}

export interface TvaMediaUri {
	_: string;
	$: _7;
}

export interface HowRelated {
	$: _11;
}

export interface _11 {
	href: string;
}

export interface ServiceInstance2 {
	$: _9;
	DisplayName: string;
	DASHDeliveryParameters: DASHDeliveryParameters;
}

export interface ServiceInstance {
	$: _9;
	DASHDeliveryParameters?: DASHDeliveryParameters;
	DVBSDeliveryParameters?: DVBSDeliveryParameters;
	DisplayName?: string;
	DVBTDeliveryParameters?: DVBTDeliveryParameters;
}

export interface DVBTDeliveryParameters {
	DVBTriplet: DVBTriplet;
	TargetCountry: string;
}

export interface DVBSDeliveryParameters {
	DVBTriplet: DVBTriplet;
}

export interface DVBTriplet {
	$: _10;
}

export interface _10 {
	origNetId: string;
	serviceId: string;
	tsId: string;
}

export interface DASHDeliveryParameters {
	UriBasedLocation: ScheduleInfoEndpoint;
}

export interface _9 {
	priority: string;
}

export interface _8 {
	version: string;
	"xmlns:hls"?: string;
}

export interface ContentGuideSourceList {
	ContentGuideSource: ContentGuideSource[];
}

export interface ContentGuideSource {
	$: _6;
	ProviderName: string;
	ScheduleInfoEndpoint: ScheduleInfoEndpoint;
	ProgramInfoEndpoint: ScheduleInfoEndpoint;
	GroupInfoEndpoint?: ScheduleInfoEndpoint;
	MoreEpisodesEndpoint?: ScheduleInfoEndpoint;
}

export interface ScheduleInfoEndpoint {
	$: _7;
	URI: string;
}

export interface _7 {
	contentType: string;
}

export interface _6 {
	CGSID: string;
}

export interface LCNTableList {
	LCNTable: LCNTable[];
}

export interface LCNTable {
	LCN: LCN[];
	TargetRegion?: string;
}

export interface LCN {
	$: _5;
}

export interface _5 {
	channelNumber: string;
	serviceRef: string;
}

export interface RegionList {
	$: _2;
	Region: Region[];
}

export interface Region {
	$: _3;
	RegionName: string;
	PostcodeRange: PostcodeRange[];
}

export interface PostcodeRange {
	$: _4;
}

export interface _4 {
	from: string;
	to: string;
}

export interface _3 {
	regionID: string;
	countryCodes?: string;
}

export interface _2 {
	version: string;
}

export interface _ {
	xmlns: string;
	"xmlns:mpeg7": string;
	"xmlns:tva": string;
	"xmlns:xsi": string;
	"xsi:schemaLocation": string;
	version: string;
}
