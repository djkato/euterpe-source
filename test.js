class AudioContexthehe {
    state = "suspended"
    constructor() { }
    resume() {
        return new Promise((resolve, reject) => {
            this.state = "running"
            resolve()
        })
    }
}
class AudioElementHehe {
    constructor() { }
    play() {
        return new Promise((resolve, reject) => {
            console.log("playing!")
            resolve()
        })
    }
    pause() {
        console.log("Pausing!")
    }
}
const audio_context = new AudioContexthehe
const audio_element = new AudioElementHehe
let is_playing = false
try_play_toggle_async()

function try_play_toggle_async() {
    return new Promise((resolve, reject) => {
        if (audio_context.state !== "running") {
            audio_context.resume().catch((e) => reject(e))
        }
        if (audio_element.paused) {
            audio_element.play().then((s) => {
                is_playing = true
                resolve(s)
            }, (r) => {
                is_playing = false
                reject(r)
            })
        } else {
            audio_element.pause()
            is_playing = false
            resolve(null)
        }
    })
}