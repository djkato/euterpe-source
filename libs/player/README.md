# Euterpe.js Player

A simple, safe AudioContext web music player.
### How to use

##### Full demo at [github link](https://github.com/euterpe-js/euterpe-source/tree/master/packages/player-web-test)

All we need to do is import the player builder and build it
```ts
import { MusicPlayerBuilder } from "@euterpe/player";
const audio_el = document.querySelector("#audio")

const music_player_builder = MusicPlayerBuilder(audio_el)

// Builder allows for attaching custom nodes if necessary, eg.
const panning_node = music_player_builder.add_stereo_panner_node()
panning_node.pan.value = -0.4
const wave_shaper_node = music_player_builder.add_wave_shaper_node()
waves_shaper_node.oversample = '4x'

const music_player = music_player_builder.build()

//Next we add a song URL to the Audio Element,
music_player.try_new_song(encodeURI("my_song.ogg"))
//and wait for the user input to resume the AudioContext
document.querySelector("#play")?.addEventListener("click", () => {
    music_player.try_play()
        .then(
            //Easily follow up with what to do next
            () => { console.log("Playing!") },
            (e) => alert("Failed to play, " + e)
        )
})
```

It's quite easy to give user the control in UI

```ts
// Play when user clicks a <button></button>
document.querySelector("#play-button")?.addEventListener("click", () => {
    music_player.try_play()
        .then(() => { console.log("Playing!") }, (e) => alert("Failed to play, " + e))
    })
// Mute when user clicks another <button></button>
document.querySelector("#mute")?.addEventListener("click", () => {
    music_player.mute()
})
// Easily give volume control via <input type="range" min="0" max="1" value="1" id="volume" step="0.01">
document.querySelector("#volume")?.addEventListener("input", (e) => {
    music_player.change_volume(e.target?.valueAsNumber)
})
```

Euterpe Player also provides functions to easily track the status of playback. It does this via Subscription/Publisher pattern which publishes every frame ( Using `requestAnimationFrame()`). This allows for always up todate values reflecting on the UI.

```ts
// Subscriptions to AudioContext changes, eg. time..
music_player.on_duration_formatted((time) => {
    //time == "4:53, "15:59", "1756:15:59"...
    document.querySelector("#duration-text").innerHTML = time
    //duration but in "0","1.2", "1223.21668181"... format
    document.querySelector("#input-seek-range").max = "" + music_player.get_current_duration()
})
//Keep the current time uptodate but formatted.
music_player.on_time_tick_formatted((time) => {
    //time == "2:52", "10:59:59"...
    document.querySelector("#current-text").innerHTML = time
})
//Keep <input type="range"..> slider uptodate
music_player.on_time_tick((time) => {
    //time == "0","1.2", "1223.21668181"...
    document.querySelector("#input-seek-range").value = "" + time
})
```

