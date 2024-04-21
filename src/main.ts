import "./components/channels-menu/channels-menu";
import "./components/dvbi-player/controls/video-controls";
import "./components/dvbi-player/dvbi-player";
import "./components/grabber/grabber";
import "./components/position-listener/position-listener";
import { DVBIClient } from "./dvb-i-client/dvb-i-client";

export const DVBI_CLIENT = new DVBIClient(
	"https://dvb-i.net/production/services.php/de"
);
