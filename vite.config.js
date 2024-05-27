import checker from "vite-plugin-checker";

const fullReloadAlways = {
	name: "full-reload-always",
	handleHotUpdate({ server }) {
		server.ws.send({ type: "full-reload" });
		return [];
	},
};

export default {
	plugins: [checker({ typescript: true }), fullReloadAlways], // e.g. use TypeScript check
	resolve: { preserveSymlinks: true },
	assetsInclude: ["**/*.png"],
	build: {
		sourcemap: true,
	},
};
