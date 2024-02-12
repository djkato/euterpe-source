import { MusicPlayerBuilder } from "@euterpe.js/player"
import { fft_data } from "./waveform_data"
import {
	AudioVisualBuilder,
	SmoothingAlgorythm,
	ShapeType,
	WaveformOrientation,
	WaveformShape
} from "@euterpe.js/visualizer"
const audio_el = document.querySelector("#audio") as HTMLAudioElement
const music_player_builder = new MusicPlayerBuilder(audio_el)
const trapnation_analyser_node = music_player_builder.add_analyser()
const bar_analyser_node = music_player_builder.add_analyser()
const music_player = music_player_builder.build()
music_player.change_volume(0.5)

const waveform_canvas = document.querySelector(
	"#waveform-canvas"
) as SVGSVGElement
const seek_element = document.querySelector("#seek") as HTMLInputElement
const duration_element = document.querySelector("#duration") as HTMLElement
const current_time_element = document.querySelector("#current") as HTMLElement
/**
 * Create the Audio Visualizer
 */
const trapnation_visual_builder = new AudioVisualBuilder(
	trapnation_analyser_node,
	document.querySelector("#trapnation-canvas") as SVGSVGElement
)
	//Because the to_fft_range is so low, it needs more FFT data.
	.set_fft_size(8192)
	//Tells the Visualiser how to parse data which mutates our initial shape
	.set_fft_data_tresholds({
		to_fft_range_i: 3,
		point_count_i: 40,
		fft_multiplier_i: 1.5,
		fft_offset_i: 150
	})
	.set_fft_time_smoothing(0.6)
	//If not using typescript enums, CatmullRom = number 2
	.set_smoothing_algorythm(SmoothingAlgorythm.CatmullRom)
const trapnation_visual = trapnation_visual_builder.build(
	ShapeType.Circle,
	false
)

const bar_visual_builder = new AudioVisualBuilder(
	bar_analyser_node,
	document.querySelector("#bar-canvas") as SVGSVGElement
)
	.set_fft_data_tresholds({
		point_count_i: 50,
		fft_multiplier_i: 2,
		fft_offset_i: -100
	})
	.set_fft_time_smoothing(0.8)
	.set_smoothing_algorythm(SmoothingAlgorythm.BezierPerpendicular)
const bar_visual = bar_visual_builder.build(ShapeType.Line, false)

const waveform_visual_builder = new AudioVisualBuilder(
	bar_analyser_node,
	waveform_canvas
)
	.set_fft_data_tresholds({
		point_count_i: 100,
		fft_multiplier_i: 1,
		fft_offset_i: -80
	})
	.set_fft_time_smoothing(0.8)
	.set_smoothing_algorythm(SmoothingAlgorythm.CatmullRom)
const waveform_visual = waveform_visual_builder.build(
	ShapeType.Waveform,
	true,
	{
		fft_data: new Float32Array(fft_data.fft_data),
		orientation: WaveformOrientation.Horizontal,
		shape_type: WaveformShape.LineLike
	}
)

trapnation_visual.draw()
bar_visual.draw()
waveform_visual.draw_once()

//Here I create 2 duplicate elements of the waveform, set their opacity to 1/2, map one to current song time, other to seeking on hover
const waveform_path_seek = waveform_canvas.children[0].cloneNode()
const waveform_path_time = waveform_canvas.children[0].cloneNode()
waveform_path_seek.id = "waveform-seek"
waveform_path_time.id = "waveform-time"
waveform_path_seek.classList.add("waveform-seek")
waveform_path_time.classList.add("waveform-time")
waveform_canvas.appendChild(waveform_path_time)
waveform_canvas.appendChild(waveform_path_seek)

/*
const time_clip_path = document.createElement("clipPath")
const seek_clip_path = document.createElement("clipPath")
const seek_clip_rect = document.createElement("rect")
const time_clip_rect = document.createElement("rect")
const time_clip_use = document.createElement("use")
const seek_clip_use = document.createElement("use")
time_clip_path.id = "clip-time"
seek_clip_path.id = "clip-seek"
time_clip_rect.id = "clip-time-rect"
time_clip_rect.setAttribute("width", "0")
time_clip_rect.setAttribute("height", "500")
seek_clip_rect.id = "clip-seek-rect"
seek_clip_rect.setAttribute("width", "200")
seek_clip_rect.setAttribute("height", "500")
time_clip_use.setAttribute("clip-path", "url(#clip-time)")
time_clip_use.setAttribute("href", "#waveform-time")
time_clip_use.classList.add("clipping-waveform")

seek_clip_use.classList.add("clipping-waveform")
seek_clip_use.setAttribute("clip-path", "url(#clip-seek)")
seek_clip_use.setAttribute("href", "#waveform-seek")

waveform_canvas.appendChild(time_clip_path)
waveform_canvas.appendChild(seek_clip_path)
waveform_canvas.appendChild(time_clip_use)
waveform_canvas.appendChild(seek_clip_use)
seek_clip_path.appendChild(seek_clip_rect)
time_clip_path.appendChild(time_clip_rect)
*/
function convert_range(value: number, r1: number[], r2: number[]) {
	return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]
}
waveform_canvas.addEventListener("mousemove", (e) => {
	const rect = e.target.getBoundingClientRect()
	const x = e.clientX - rect.left
	const resX = convert_range(
		x,
		[0, rect.width],
		[0, waveform_canvas.viewBox.baseVal.width + 40]
	)
	const polygon = `polygon(0 0, ${resX}px 0, ${resX}px 100%, 0 100%)`
	document.documentElement.style.setProperty("--clip-seek-path", polygon)
})
waveform_canvas.addEventListener("mouseleave", (e) => {
	const polygon = `polygon(0 0, 0 0, 0 100%, 0 100%)`
	document.documentElement.style.setProperty("--clip-seek-path", polygon)
})
/*
 * The player part
 */
music_player
	.try_new_song_async(
		encodeURI("http://localhost:4200/nuphory - NVISION (EXTENDED MIX).ogg")
	)
	.then(
		() => {
			let is_seeking = false
			document.querySelector("#play")?.addEventListener("click", () => {
				music_player.play_async().then(
					() => {
						console.log("Playing!")
					},
					(e) => alert("Failed to play, " + e)
				)
			})
			document.querySelector("#pause")?.addEventListener("click", () => {
				music_player.pause()
			})
			document.querySelector("#mute")?.addEventListener("click", () => {
				music_player.mute()
			})
			document.querySelector("#unmute")?.addEventListener("click", () => {
				music_player.unmute()
			})
			document
				.querySelector("#toggle-mute")
				?.addEventListener("click", () => {
					music_player.mute_toggle()
				})
			document
				.querySelector("#toggle-play")
				?.addEventListener("click", () => {
					music_player.play_toggle_async().then(
						(s) => console.log("toggled play/pause"),
						(e) => alert("failed to toggle pause/play!" + e)
					)
				})
			document
				.querySelector("#volume")
				?.addEventListener("input", (e) => {
					music_player.change_volume(e.target?.valueAsNumber)
				})
			document
				.querySelector("#seek")
				?.addEventListener("mousedown", (e) => {
					is_seeking = true
				})
			document
				.querySelector("#seek")
				?.addEventListener("mouseup", (e) => {
					music_player.try_seek_async(e.target?.valueAsNumber).then(
						() => {
							console.log("seeked to " + e.target?.valueAsNumber)
						},
						() => {
							alert("Failed seeking! " + e)
						}
					)
					is_seeking = false
				})
			// Subscriptions to AudioContext changes, eg. time..
			music_player.on_duration_formatted((time) => {
				duration_element.innerHTML = time
				seek_element.max = "" + music_player.current_song_duration
			})
			music_player.on_time_tick_formatted((time) => {
				current_time_element.innerHTML = time
			})
			music_player.on_time_tick((time) => {
				if (is_seeking) return
				seek_element.value = "" + time
				const x = `${
					(time / music_player.current_song_duration) * 100
				}%`
				const polygon = `polygon(0 0, ${x} 0, ${x} 100%, 0 100%)`
				document.documentElement.style.setProperty(
					"--clip-time-path",
					polygon
				)
			})
		},
		(e) => console.log(e)
	)
