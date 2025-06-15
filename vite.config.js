import { resolve } from "path";

const fullReloadAlways = {
	name: "full-reload-always",
	handleHotUpdate({ server }) {
		server.ws.send({ type: "full-reload" });
		return [];
	},
};

export default {
	resolve: { preserveSymlinks: true },
	assetsInclude: ["**/*.png", "**/*.gltf"],
	base: "/dvb-i-client-webxr/",
	build: {
		sourcemap: true,
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
			},
		},
	},
};
