import { LoaderConfig, T } from "hyperimport";
export default {
	buildCommand: ["rustc", "--crate-type", "cdylib", "/home/djkato/Code PF/euterpe-preprocessor/src/lib.rs", "--out-dir", "build/lib.rs"],
	outDir: "build/lib.rs",
	symbols: {
		get_fft_data: {
			args: [],
			returns: T.cstring
		},
	}
} satisfies LoaderConfig.Main;
