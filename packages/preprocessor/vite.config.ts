/// <reference types="vitest" />
import { defineConfig } from "vite"

import viteTsConfigPaths from "vite-tsconfig-paths"

export default defineConfig({
	cacheDir: "../../node_modules/.vite/preprocessor",

	server: {
		port: 4201,
		host: "localhost"
	},

	preview: {
		port: 4300,
		host: "localhost"
	},

	plugins: [
		viteTsConfigPaths({
			root: "."
		})
	]

	// Uncomment this if you are using workers.
	// worker: {
	//  plugins: [
	//    viteTsConfigPaths({
	//      root: '../../',
	//    }),
	//  ],
	// },
})
