import { MusicPlayerBuilder } from "@euterpe.js/player";
const audio_el = document.querySelector("#audio") as HTMLAudioElement
const music_player_builder = new MusicPlayerBuilder(audio_el)
const music_player = music_player_builder.build()
music_player.change_volume(1)

music_player.try_new_song_async(encodeURI("http://127.0.0.1:4200/nuphory - NVISION (EXTENDED MIX).ogg"))
    .then(() => {
        let is_seeking = false
        document.querySelector("#play")?.addEventListener("click", () => {
            //const analyser_node = music_player_builder.add_analyser()
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