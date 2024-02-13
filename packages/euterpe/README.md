# Euterpe

Fully featured AudioContext music player for the web.

## Euterpe in production:
- Hypertrance ( [site](https://hypertrance.eu/), [repository](https://github.com/nuphory/hypertrance.eu) )

Features:
 - "Local" library/database for songs, collections, artists, waveforms, artist links and much more! 
 - Queue and history
 - Easy way to create Vector based audio visuals
 - Library automatization based on folder/file structure, preprocessing and encoding media files for all platforms
 - Safe. Provides wrappers for all functions that are either unsafe or don't give a success return. (very Rust inspired, yes.)
 - Frontend library agnostic

## How to use:

#### Simple demo [here](https://github.com/euterpe-js/euterpe-source/tree/master/packages/euterpe-web-test)

Since this package is just a compilation of our smaller modules, you can read individual modules' tutorials on their respective npm page:
 - [Euterpe Player](https://www.npmjs.com/package/@euterpe.js/player)
 - [Euterpe Visualizer](https://www.npmjs.com/package/@euterpe.js/visualizer)
 - [Euterpe Music Library](https://www.npmjs.com/package/@euterpe.js/music-library)

 You can further check out how to automate database creation from folder structure, auto encode media for all platforms and create waveform svgs for songs here:
- [Euterpe Preprocessor](https://www.npmjs.com/package/@euterpe.js/preprocessor)

This module builds on those, and further adds functions for playing backwards, forwards and managing the queue.

First we create a database with our songs

`db.ts`
```ts
import { DB, Song, Artist, Ref, RefTo, Platforms } from "@euterpe.js/music-library"
export const db = new DB

db.add([
    //The IDs are added incrementally & are 0 based., so first artists ID added is 0, next 1 etc...
    //You can specify the ID manually if you want
    new Artist({
        name: "Machinedrum",
    }),
    new Artist({
        name: "Tanerélle",
    }),
    new Artist({
        name: "Mono/Poly",
    }),
    new Artist({
        name: "IMANU",
        links: [
            [Platforms.Spotify, new URL("https://open.spotify.com/artist/5Y7rFm0tiJTVDzGLMzz0W1?si=DRaZyugTTIqlBHDkMGKVqA&nd=1")]
        ]
    }),
])
db.add([
    new Song({
        //Refrences are constructed as such. This allows to get to the artist from either collection or song
        artists: [new Ref(RefTo.Artists, 2), new Ref(RefTo.Artists, 3), new Ref(RefTo.Artists, 4)],
        duration: 252,
        name: "Star",
        remix_artists: [new Ref(RefTo.Artists, 5)],
        url: new URL("http://" + window.location.host + "/Machinedrum, Tanerelle & Mono Poly - Star (IMANU Remix) final.mp3")
    }),
])

```

Then we build our Euterpe player and assign the db to it. Then it's just a matter of creating event listeners to the dom and binding them to Euterpes functions.

`main.ts`
```ts
import { db } from "./db";
import { EuterpeBuilder } from "@euterpe.js/euterpe"

let is_seeking = false
const euterpe = new EuterpeBuilder(document.querySelector("#audio")!, db)
    .build()

document.querySelector("#seek")?.addEventListener("mouseup", (e) => {
	try {
		euterpe.try_seek(e.target?.valueAsNumber)
	} catch {
		alert("Failed seeking! " + e)
	}
	is_seeking = false
})

euterpe.on_song_change((_, song_name) => {
	document.querySelector("#text-playing")!.innerHTML = song_name
})

document.querySelector("#previous")?.addEventListener("click", () => {
	euterpe.try_previous_song_looping().catch((e) => alert(e + "Failed to change song"))
})

document.querySelector("#next")?.addEventListener("click", () => {
	euterpe.try_next_song_looping().catch((e) => alert(e + "Failed to change song"))
})

document.querySelector("#mute")?.addEventListener("click", () => {
	euterpe.mute()
})

document.querySelector("#unmute")?.addEventListener("click", () => {
	euterpe.unmute()
})

document.querySelector("#toggle-play")?.addEventListener("click", () => {
	euterpe.try_play_toggle().catch((e) => alert("failed to toggle pause/play!" + e))
})

document.querySelector("#volume")?.addEventListener("input", (e) => {
	euterpe.change_volume(e.target?.valueAsNumber)
})

//disables time updates so the time slider doesn't slip away from user
document.querySelector("#seek")?.addEventListener("mousedown", () => {
	is_seeking = true
})

```

Then we can set up listeners to Euterpes events to keep the UI up todate as well

`main.ts`
```ts
//...
// Subscriptions to song and AudioContext changes, eg. time, name..
euterpe.on_duration_formatted((time) => {
	document.querySelector("#duration")!.innerHTML = time
	document.querySelector("#seek")!.max = "" + euterpe.current_song_duration
})

euterpe.on_time_tick_formatted((time) => {
	document.querySelector("#current")!.innerHTML = time
})

euterpe.on_time_tick((time) => {
	if (is_seeking) return
	document.querySelector("#seek")!.value = "" + time
	dev_queue_update()
	dev_history_update()
})

euterpe.on_song_change((_, song_name) => {
	document.querySelector("#text-playing")!.innerHTML = song_name
})

//preload after setting all listeners to make sure you capture the song update!
euterpe.try_preload_song(0).catch((e) => console.log(e + " Failed to preload"))

//..
function dev_queue_update() {
	const p = document.querySelector("#queue-info") as HTMLParagraphElement
	const dev_arr = []
	for (const song of euterpe.queue) {
		dev_arr.push(`Name: ${song.name}, ID: ${song.id} |`)
	}
	p.innerHTML = dev_arr.toString()
}

function dev_history_update() {
	const p = document.querySelector("#history-info") as HTMLParagraphElement
	const dev_arr = []
	for (const song of euterpe.played_history) {
		dev_arr.push(`Name: ${song.name}, ID: ${song.id} |`)
	}
	p.innerHTML = dev_arr.toString()
}

```
and it's done!
For vizualizer demo, or how to use the core parts of the Euterpe libraries separately, check out the individual repos readmes.


