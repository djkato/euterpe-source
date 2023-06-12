import { MusicPlayerBuilder } from "@euterpe.js/player";
import { AudioVisualBuilder, SmoothingAlgorythm, ShapeType } from "@euterpe.js/visualizer"
const audio_el = document.querySelector("#audio") as HTMLAudioElement
const music_player_builder = new MusicPlayerBuilder(audio_el)
const trapnation_analyser_node = music_player_builder.add_analyser()
const bar_analyser_node = music_player_builder.add_analyser()
const music_player = music_player_builder.build()
music_player.change_volume(1)

/**
 * Create the Audio Visualizer
 */
const trapnation_visual_builder = new AudioVisualBuilder(trapnation_analyser_node, document.querySelector("#trapnation-canvas") as SVGSVGElement)
    //Because the to_fft_range is so low, it needs more FFT data.
    .set_fft_size(8192)
    //Tells the Visualiser how to parse data which mutates our initial shape
    .set_fft_data_tresholds({ to_fft_range_i: 3, point_count_i: 40, fft_multiplier_i: 1.5, fft_offset_i: 150 })
    .set_fft_time_smoothing(0.6)
    //If not using typescript enums, CatmullRom = number 2
    .set_smoothing_algorythm(SmoothingAlgorythm.CatmullRom)
const trapnation_visual = trapnation_visual_builder.build(ShapeType.Circle)

const bar_visual_builder = new AudioVisualBuilder(bar_analyser_node, document.querySelector("#bar-canvas") as SVGSVGElement)
    .set_fft_data_tresholds({ point_count_i: 50, fft_multiplier_i: 3, fft_offset_i: -30 })
    .set_fft_time_smoothing(0.8)
    .set_smoothing_algorythm(SmoothingAlgorythm.BezierPerpendicular)
const bar_visual = bar_visual_builder.build(ShapeType.Line)


trapnation_visual.draw()
bar_visual.draw()


/*
 * The player part
 */
music_player.try_new_song_async(encodeURI("http://127.0.0.1:4200/nuphory - NVISION (EXTENDED MIX).ogg"))
    .then(() => {
        let is_seeking = false
        document.querySelector("#play")?.addEventListener("click", () => {
            music_player.play_async()
                .then(() => { console.log("Playing!") }, (e) => alert("Failed to play, " + e))
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
        document.querySelector("#toggle-mute")?.addEventListener("click", () => {
            music_player.mute_toggle()
        })
        document.querySelector("#toggle-play")?.addEventListener("click", () => {
            music_player.play_toggle_async().then((s) => console.log("toggled play/pause"), (e) => alert("failed to toggle pause/play!" + e))
        })
        document.querySelector("#volume")?.addEventListener("input", (e) => {
            music_player.change_volume(e.target?.valueAsNumber)
        })
        document.querySelector("#seek")?.addEventListener("mousedown", (e) => {
            is_seeking = true;
        })
        document.querySelector("#seek")?.addEventListener("mouseup", (e) => {
            music_player.try_seek_async(e.target?.valueAsNumber).then(() => { console.log("seeked to " + e.target?.valueAsNumber) }, () => {
                alert("Failed seeking! " + e)
            })
            is_seeking = false
        })
        // Subscriptions to AudioContext changes, eg. time..
        music_player.on_duration_formatted((time) => {
            document.querySelector("#duration").innerHTML = time
            document.querySelector("#seek").max = "" + music_player.current_song_duration
        })
        music_player.on_time_tick_formatted((time) => {
            document.querySelector("#current").innerHTML = time
        })
        music_player.on_time_tick((time) => {
            if (is_seeking) return
            document.querySelector("#seek").value = "" + time
        })

    }, (e) => console.log(e))