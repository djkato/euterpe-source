import { db } from "./db";
import { EuterpeBuilder } from "@euterpe.js/euterpe";

let is_seeking = false
// document.addEventListener("click", start, { once: true })
const euterpe = new EuterpeBuilder(document.querySelector("#audio")!, db)
    .build()
add_library_to_dom()

euterpe.try_preload_song(0).then(() => {
    document.querySelector("#text-playing")!.innerHTML = euterpe.format_current_song()
}, (e) => console.log(e + " Failed to preload"))

document.querySelector("#seek")?.addEventListener("mouseup", (e) => {
    try {
        euterpe.try_seek(e.target?.valueAsNumber)
        console.log("seeked to " + e.target?.valueAsNumber)
    } catch {
        alert("Failed seeking! " + e)
    }
    is_seeking = false
})

// Subscriptions to AudioContext changes, eg. time..
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

document.querySelector("#previous")?.addEventListener("click", () => {
    euterpe.try_previous_song_looping().then(() => {
        document.querySelector("#text-playing")!.innerHTML = euterpe.format_current_song()
    }, (e) => alert(e + "Failed to change song"))
})
document.querySelector("#next")?.addEventListener("click", () => {
    euterpe.try_next_song_looping().then(() => {
        document.querySelector("#text-playing")!.innerHTML = euterpe.format_current_song()
    }, (e) => alert(e + "Failed to change song"))
})

document.querySelector("#play")?.addEventListener("click", () => {
    euterpe.try_play().catch((e) => alert("Failed to play, " + e))
})
document.querySelector("#pause")?.addEventListener("click", () => {
    euterpe.pause()
})
document.querySelector("#mute")?.addEventListener("click", () => {
    euterpe.mute()
})
document.querySelector("#unmute")?.addEventListener("click", () => {
    euterpe.unmute()
})
document.querySelector("#toggle-mute")?.addEventListener("click", () => {
    euterpe.mute_toggle()
})
document.querySelector("#toggle-play")?.addEventListener("click", () => {
    euterpe.try_play_toggle().catch((e) => alert("failed to toggle pause/play!" + e))
})
document.querySelector("#volume")?.addEventListener("input", (e) => {
    euterpe.change_volume(e.target?.valueAsNumber)
})
//disables time updates so the time slider doesn't slip away from user
document.querySelector("#seek")?.addEventListener("mousedown", () => {
    is_seeking = true;
})

function add_library_to_dom() {
    const lib_dom = document.querySelector(".library-wrapper") as HTMLDivElement
    for (const song of euterpe.db.songs) {
        const div = document.createElement("div")
        const p = document.createElement("p")
        const button_play = document.createElement("button")
        const button_queue = document.createElement("button")
        const span = document.createElement("span")
        p.innerHTML = `${euterpe.format_current_song(song.id)}`

        button_play.innerHTML = "play"
        button_play.dataset["id"] = `${song.id}`
        button_play.onclick = library_play

        button_queue.innerHTML = "queue"
        button_queue.dataset["id"] = `${song.id}`
        button_queue.onclick = library_queue

        div.appendChild(p)
        span.appendChild(button_play)
        span.appendChild(button_queue)
        div.appendChild(span)

        lib_dom.appendChild(div)
    }
}
function library_play(e: MouseEvent) {
    const b = e.currentTarget as HTMLButtonElement
    euterpe.try_specific_song(parseInt(b.dataset["id"]!)).then(
        () => document.querySelector("#text-playing")!.innerHTML = euterpe.format_current_song(),
        (e) => alert(e)
    )
}
function library_queue(e: MouseEvent) {
    const b = e.currentTarget as HTMLButtonElement
    euterpe.queue_append(parseInt(b.dataset["id"]!))
}
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