import { DB, from_json } from "@euterpe.js/music-library"
import { generate_db } from "./generate_db"
import { AudioVisualBuilder, SmoothingAlgorythm, ShapeType, WaveformOrientation, WaveformShape } from "@euterpe.js/visualizer"

let result: AnalyzeReturn | undefined

let db = generate_db()
//Create all audio nodes
const audioEl = document.querySelector("#audio") as HTMLAudioElement
const audioContext = new AudioContext()
const track = audioContext.createMediaElementSource(audioEl)
const gain = audioContext.createGain()
gain.gain.value = 0
const audioContextAnalyser = audioContext.createAnalyser()
audioContextAnalyser.fftSize = 32
audioContextAnalyser.smoothingTimeConstant = 0
const analyserBufferLength = audioContextAnalyser.frequencyBinCount
const FFTDataArray = new Float32Array(analyserBufferLength)
//Connect all audio Nodes
track.connect(audioContextAnalyser).connect(gain).connect(audioContext.destination)

document.getElementById("analyze")!.addEventListener("click", async (ev) => {
	audioContext.resume()
	result = await analyze()
	download(JSON.stringify(result.db), "db.json", "text/plain")
})

document.getElementById("create-svg")!.addEventListener("click", (ev) => {
	audioContext.resume()
	svg()
})

document.getElementById("upload")!.addEventListener("change", (ev) => {
	audioContext.resume()
	const fileReader = new FileReader()
	fileReader.readAsText(ev.target.files[0])
	fileReader.onload = (event) => {
		let str = JSON.parse(event.target.result)
		let new_db = from_json(str)
		//-infinity get stringified to null, undo that
		for (const song of new_db.songs) {
			if (song.fft_data) {
				for (let i = 0; i < song.fft_data.length; i++) {
					if (song.fft_data[i] === null || song.fft_data[i] === undefined) song.fft_data[i] = -Infinity
				}
			}
		}
		result = { db: new_db, analyzer_node: audioContextAnalyser }
	}
})

async function svg() {
	if (!result) {
		alert("not analyzed yet!")
		return
	}
	console.log("Creating svgs...")
	const canvas_wrapper = document.querySelector(".canvas-wrapper") as HTMLElement

	const waveform_canvas = document.querySelector("#waveform-canvas")?.cloneNode() as SVGSVGElement

	canvas_wrapper.childNodes.forEach((c) => c.remove())
	canvas_wrapper.appendChild(waveform_canvas)

	for (const song of result.db.songs) {
		console.log("creating waveform for -> " + song.name)
		const curr_waveform_canvas = waveform_canvas.cloneNode() as SVGSVGElement
		waveform_canvas.parentElement?.append(curr_waveform_canvas)
		const waveform_visual_builder = new AudioVisualBuilder(result.analyzer_node, curr_waveform_canvas)
			.set_fft_data_tresholds({
				point_count_i: 100,
				fft_multiplier_i: 0.9,
				fft_offset_i: -65
			})
			.set_fft_time_smoothing(0.8)
			.set_smoothing_algorythm(SmoothingAlgorythm.CatmullRom)
		const waveform_visual = waveform_visual_builder.build(ShapeType.Waveform, true, {
			fft_data: new Float32Array(new Float64Array(song.fft_data!)),
			orientation: WaveformOrientation.Horizontal,
			shape_type: WaveformShape.LineLike
		})
		waveform_visual.draw_once()
		// await new Promise<void>((done) => setTimeout(() => done(), 500))
		// @ts-ignore
		song.metadata[0] = curr_waveform_canvas.children[0].getAttribute("d")
		song.fft_data = []
	}
	waveform_canvas.remove()
	console.dir(result.db, { depth: null })
	download(JSON.stringify(result.db), "db.json", "text/plain")
}
async function analyze(): Promise<AnalyzeReturn> {
	console.clear()
	const audioEl = document.querySelector("#audio") as HTMLAudioElement
	console.log("analysing...")
	const samplingRate = 100

	// db.songs.splice(0, 10)
	// db.songs.splice(2)
	console.log(db)
	for (const song of db.songs) {
		// const song = db.songs[db.songs.length - 1]
		console.log(`Analyzing ${song.name}, ${db.songs.indexOf(song) + 1}/${db.songs.length}`)
		//if not loaded yet keep trying
		audioEl.src = song.url.href
		await awaitLoad(audioEl)
		song.duration = audioEl.duration
		let currentFFTData = []
		for (let curSecond = 0; curSecond < song.duration; curSecond += song.duration / samplingRate) {
			console.log("working...")
			audioEl.currentTime = curSecond
			await audioEl.play()
			await new Promise<void>((done) => setTimeout(() => done(), 100))
			audioContextAnalyser.getFloatFrequencyData(FFTDataArray)
			let volume = 0
			FFTDataArray.forEach((element) => {
				volume += element
			})
			currentFFTData.push(Math.round((volume / FFTDataArray.length) * 100) / 100)
		}
		song.fft_data = currentFFTData
		console.log(song.fft_data)
	}
	console.log("Analyzation finished!")
	const result: AnalyzeReturn = {
		analyzer_node: audioContextAnalyser,
		db: db
	}
	return result
}
function download(content: BlobPart, fileName: string, contentType: string) {
	var a = document.querySelector("#download") as HTMLAnchorElement
	var file = new Blob([content], { type: contentType })
	a.href = URL.createObjectURL(file)
	a.download = fileName
	// a.click();
}
type AnalyzeReturn = {
	analyzer_node: AnalyserNode
	db: DB
}
function awaitLoad(audioEl: HTMLAudioElement) {
	return new Promise<void>((resolve, reject) => {
		audioEl.addEventListener("loadeddata", function () {
			if (audioEl.readyState >= 4) {
				resolve()
			}
		})
	})
}
