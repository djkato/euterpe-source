import { MusicPlayerBuilder } from "@euterpe/player";
import { AudioVisualBuilder, SmoothingAlgorythm, ShapeType } from "@euterpe/visualizer";
const audio_el = document.querySelector("#audio") as HTMLAudioElement
const music_player_builder = MusicPlayerBuilder(audio_el)
music_player_builder.start()
const analyser_node = music_player_builder.add_analyser()
const music_player = music_player_builder.build()
music_player.change_volume(1)



const trapnation_visual_builder = AudioVisualBuilder(analyser_node, document.querySelector("#trapnation-canvas") as SVGSVGElement)
trapnation_visual_builder.start()
trapnation_visual_builder.set_fft_size(8192)
trapnation_visual_builder.set_fft_data_tresholds({ to_fft_range_i: 3, point_count_i: 50, fft_multiplier_i: 1, fft_offset_i: -80 })
trapnation_visual_builder.set_fft_time_smoothing(0.6)
//If not using typescript enums, CatmullRom = number 2
trapnation_visual_builder.set_smoothing_algorythm(SmoothingAlgorythm.CatmullRom)
const trapnation_visual = trapnation_visual_builder.build(ShapeType.Circle)

const bar_visual_builder = AudioVisualBuilder(analyser_node, document.querySelector("#bar-canvas") as SVGSVGElement)
bar_visual_builder.start()
bar_visual_builder.set_fft_data_tresholds({ to_fft_range_i: 10, point_count_i: 10, fft_multiplier_i: 1.5, fft_offset_i: 50 })
bar_visual_builder.set_fft_time_smoothing(0.8)
//If not using typescript enums, CatmullRom = number 2
bar_visual_builder.set_smoothing_algorythm(SmoothingAlgorythm.Linear)
const bar_visual = trapnation_visual_builder.build(ShapeType.Line)


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
        music_player.subscribe_to_formatted_duration_time((time) => {
            document.querySelector("#duration").innerHTML = time
            document.querySelector("#seek").max = "" + music_player.get_current_duration()
        })
        music_player.subscribe_to_formatted_current_time_tick((time) => {
            document.querySelector("#current").innerHTML = time
        })
        music_player.subscribe_to_time_tick((time) => {
            if (is_seeking) return
            document.querySelector("#seek").value = "" + time
        })

    }, (e) => console.log(e))