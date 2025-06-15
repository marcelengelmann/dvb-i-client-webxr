import "./components/channels-menu/dvb-i-channels-menu.ts";
import "./components/controls/dvb-i-controller.ts";
import "./components/position-listener/camera-position-listener.ts";
import "./components/trash-bin/dvb-i-trash-bin.ts";
import "./components/video-player/dvb-i-video-player.ts";
import "./components/video-player/video-controls/dvb-i-video-player-controls.ts";
import { DVBIClient } from "./dvb-i-client/dvb-i-client";

export const DVBI_CLIENT = new DVBIClient(
	"https://dvb-i.net/production/services.php/de"
);
