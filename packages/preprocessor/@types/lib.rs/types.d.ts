declare module "*/lib.rs" {
	const symbols: import("bun:ffi").ConvertFns<typeof import("./config.ts").default.symbols>;
	export = symbols;
}