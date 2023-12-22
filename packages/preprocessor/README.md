# How to use
To extend the Rust library, make sure the functions you're exporting have `#[no_mangle]` derived 
and they `extern "C"`. To use, just import `{func} from "./lib.rs"`. 
To make sure args and return types match, go to `@types/lib.rs/config.ts` 
and change the types of args and returns.

```
bun i
bun dev
```

```
open http://localhost:3000
```
