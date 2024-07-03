import { MusicPlayerBuilder } from "@euterpe.js/player"
import { db } from "./db"
import { Artist } from "@euterpe.js/music-library"
import { DB, Platforms } from "@euterpe.js/music-library"
const audio_el = document.querySelector("#audio") as HTMLAudioElement
const music_player_builder = new MusicPlayerBuilder(audio_el)
const music_player = music_player_builder.build()
music_player.change_volume(1)

let curr_song_id = 1
const elem_curr_song = document.querySelector("#text-playing")

let is_seeking = false

document.querySelector("#previous")?.addEventListener("click", () => {
	curr_song_id--
	if (curr_song_id < 0) curr_song_id = 2
	music_player.try_new_song(db.songs[curr_song_id].url.pathname).then(
		() => {
			change_current_song_text(db)
			music_player.try_play().catch((err) => {
				console.log(err)
			})
		},
		(e) => {
			console.log(e)
		}
	)
})

document.querySelector("#next")?.addEventListener("click", () => {
	curr_song_id++
	if (curr_song_id > 2) curr_song_id = 0
	music_player.try_new_song(db.songs[curr_song_id].url.pathname).then(
		() => {
			change_current_song_text(db)
			music_player.try_play().catch((err) => {
				console.log(err)
			})
		},
		(e) => {
			console.log(e)
		}
	)
})

document.querySelector("#play")?.addEventListener("click", () => {
	music_player.try_play().then(
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

document.querySelector("#toggle-mute")?.addEventListener("click", () => {
	music_player.mute_toggle()
})

document.querySelector("#toggle-play")?.addEventListener("click", () => {
	music_player.try_play_toggle().then(
		(s) => console.log("toggled play/pause"),
		(e) => alert("failed to toggle pause/play!" + e)
	)
})

document.querySelector("#volume")?.addEventListener("input", (e) => {
	music_player.change_volume(e.target?.valueAsNumber)
})

document.querySelector("#seek")?.addEventListener("mousedown", (e) => {
	is_seeking = true
})

document.querySelector("#seek")?.addEventListener("mouseup", (e) => {
	music_player.try_seek(e.target?.valueAsNumber).then(
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
	document.querySelector("#duration")!.innerHTML = time
	document.querySelector("#seek")!.max = "" + music_player.current_song_duration
})

music_player.on_time_tick_formatted((time) => {
	document.querySelector("#current")!.innerHTML = time
})

music_player.on_time_tick((time) => {
	if (is_seeking) return
	document.querySelector("#seek")!.value = "" + time
})

music_player.try_new_song(db.songs[curr_song_id].url.pathname).then(() => {})
change_current_song_text(db)

function change_current_song_text(db: DB) {
	const curr_song = db.songs[curr_song_id]
	let final_text = ""

	for (const artist of curr_song.artists) {
		const curr_artist = artist.get(db) as Artist
		final_text += curr_artist.name + ", "
	}

	final_text = final_text.slice(0, final_text.length - 2) // remove trailing ", "
	final_text += " - " + curr_song.name

	if (curr_song.remix_artists.length > 0) {
		final_text += " ("

		for (const artist of curr_song.remix_artists) {
			const curr_artist = artist.get(db) as Artist
			if (curr_artist.links && curr_artist.links.length > 0) {
				//returns "found a link! Spotify"
				console.log("found a link! " + Platforms[curr_artist.links[0][0]])

				const url = curr_artist.links[0][1]
				final_text += `<a href=${url}>${curr_artist.name}</a>, `
			} else {
				final_text += curr_artist.name + ", "
			}
		}

		final_text = final_text.slice(0, final_text.length - 2) // remove trailing ", "
		final_text += " Remix)"
	}

	elem_curr_song!.innerHTML = final_text
}
