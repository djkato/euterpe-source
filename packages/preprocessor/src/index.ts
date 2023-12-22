import { Hono } from 'hono'
import { get_fft_data } from "./lib.rs"
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use("/media", serveStatic({ root: "./public/media" }))
app.use("/samples", serveStatic({ root: "./public/samples" }))
app.use('/', serveStatic({ root: "./client" }))
app.get("/api/generate", (c) => {
	let res = get_fft_data()
	return c.json({ res })
})
export default app
