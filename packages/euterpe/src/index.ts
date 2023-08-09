import { MusicPlayer } from "@euterpe.js/player"
import { DB, Song, Artist } from "@euterpe.js/music-library"

export { Euterpe, EuterpeBuilder }
/**
 * Avoid Writing directly to any fields in this class!
 */
class Euterpe extends MusicPlayer {
    current_song: Song | undefined
    current_song_id = 0
    queue: Song[] = []
    played_history: Song[] = []
    constructor(
        public db: DB,
        audio_context: AudioContext,
        audio_element: HTMLAudioElement,
        track: MediaElementAudioSourceNode,
        gain: GainNode,
        volume: number,
        current_song_path?: string,
        private options?: BuilderOptions
    ) {

        super(audio_context, audio_element, track, gain, volume, current_song_path)
    }

    /**
     * Use to load song on page load.
     * @throws if song with ID doesn't exist
     */
    async try_preload_song(id: number) {
        const next = this.db.songs.find((song) => song!.id == id)
        if (!next) throw new Error(`Song with id ${id} doesn't exist`)
        else {
            await this.try_new_song(next.url.pathname)
            this.current_song = next
        }
    }

    /**
     * Won't loop back to first song if already on the last.
     * If queue present, uses that, if not, relies on Song ID directly from DB
     * @throws if on last song or song fails to start
     */
    async try_next_song() {
        let new_song: Song
        if (this.queue.length > 0) {
            new_song = this.queue.shift()!
        } else {
            let id_i = this.db.songs.length;
            while (this.db.songs[--id_i].id! > this.current_song_id);
            const next_id = ++id_i;

            if (next_id == this.db.songs.length) throw new Error("Won't go past the last song")
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        await this.try_new_song(url)
        await this.try_play()
        if (this.current_song) this.played_history.push(this.current_song)
        this.current_song = new_song
        this.current_song_id = new_song.id!
    }

    /**
     * Will loop back to first song if already on last song,
     * If queue present, uses that, if not, relies on Song ID directly from DB
     */
    async try_next_song_looping() {
        let new_song: Song
        if (this.queue.length > 0) {
            new_song = this.queue.shift()!
        } else {
            let id_i = this.db.songs.length;
            while (this.db.songs[--id_i].id! > this.current_song_id);
            let next_id = ++id_i

            if (next_id == this.db.songs.length) next_id = this.db.songs[0].id!
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        await this.try_new_song(url)
        await this.try_play()
        if (this.current_song) this.played_history.push(this.current_song)
        this.current_song = new_song
        this.current_song_id = new_song.id!
    }

    /**
     * Won't tell you if the playback was successsful & wil loop back if already on last song. Best use try_next_song_async()
     * If queue present, uses that, if not, relies on Song ID directly from DB
     */
    next_song_looping() {
        let new_song: Song
        if (this.queue.length > 0) {
            new_song = this.queue.shift()!
        } else {
            let id_i = this.db.songs.length;
            while (this.db.songs[--id_i].id! > this.current_song_id);
            let next_id = ++id_i;

            if (next_id == this.db.songs.length) next_id = this.db.songs[0].id!
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        this.new_song(url)
        this.play()
        if (this.current_song) this.played_history.push(this.current_song)
        this.current_song = new_song
        this.current_song_id = new_song.id!
    }

    /**
     * Won't tell you if the playback was successsful, won't loop back if already on last song and won't throw error if attempted. Best use next_song_async()
     * If queue present, uses that, if not, relies on Song ID directly from DB
     */
    next_song() {
        let new_song: Song
        if (this.queue.length > 0) {
            new_song = this.queue.shift()!
        } else {
            let id_i = this.db.songs.length;
            while (this.db.songs[--id_i].id! > this.current_song_id);
            const next_id = ++id_i;
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        this.new_song(url)
        this.play()
        if (this.current_song) this.played_history.push(this.current_song)
        this.current_song = new_song
        this.current_song_id = new_song.id!
    }

    /**
     * Uses safer try_play_async. Normal play / play_async will try to start the player even if the track hasn't started yet, or was previously suspended/closed
     */
    async try_specific_song(new_song_id: number) {
        const new_song = this.db.songs.find((song) => song.id! == new_song_id)
        if (!new_song) throw new Error(`No song with id "${new_song_id}" found`)
        else {
            this.try_new_song(new_song.url.pathname)
            await this.try_play()
            if (this.current_song) this.played_history.push(this.current_song)
            this.current_song = new_song
            this.current_song_id = new_song.id!
        }
    }

    /**
     * Won't throw an error if new ID not found. Won't  tell you if the play was successful, best use specific_song_async() or try_specific_song_async()
     */
    specific_song(new_song_id: number) {
        const new_song = this.db.songs.find((song) => song.id! == new_song_id)
        if (!new_song) return
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        this.new_song(url)
        this.play()
        if (this.current_song) this.played_history.push(this.current_song)
        this.current_song = new_song
        this.current_song_id = new_song.id!
    }

    /**
     * Won't loop back to first song if already on the last.
     * If played_history is present, uses that, if not, relies on Song ID directly from DB
     * @throws if playback was unsuccessful or at first song/ can't go more previous
     */
    async try_previous_song() {
        let new_song: Song
        if (this.played_history.length > 0) {
            new_song = this.played_history.pop()!
        } else {
            let id_i = 0;
            while (this.db.songs[++id_i].id! < this.current_song_id);
            const next_id = --id_i;

            if (next_id == this.db.songs.length) throw new Error("Won't roll backwards to last song")
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        await this.try_new_song(url)
        await this.try_play()
        //if (this.current_song) this.played_history.push(this.current_song)
        this.current_song = new_song
        this.current_song_id = new_song.id!
    }

    /**
     * Will loop back to first song if already on the last.
     * If history present, uses that, if not, relies on Song ID directly from DB
     */
    async try_previous_song_looping() {
        let new_song: Song
        if (this.played_history.length > 0) {
            new_song = this.played_history.pop()!
        } else {
            let id_i = -1;
            while (this.db.songs[++id_i].id! < this.current_song_id);
            let next_id = --id_i;

            if (next_id == -1) next_id = this.db.songs[this.db.songs.length - 1].id!
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        await this.try_new_song(url)
        await this.try_play()
        //if (this.current_song) this.played_history.push(this.current_song)
        this.current_song = new_song
        this.current_song_id = new_song.id!
    }

    /**
     * won't tell you if the play was successful, won't loop back to last song if already on the first and will throw error if attempted.
     * If history present, uses that, if not, relies on Song ID directly from DB
     */
    previous_song() {
        let new_song: Song
        if (this.played_history.length > 0) {
            new_song = this.played_history.pop()!
        } else {
            let id_i = 0;
            while (this.db.songs[++id_i].id! < this.current_song_id);
            const next_id = -id_i;

            if (next_id == this.db.songs.length) throw new Error("Won't go past the last song")
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        this.new_song(url)
        this.play()
        //if (this.current_song) this.played_history.push(this.current_song)
        this.current_song_id = new_song.id!
        this.current_song = new_song
    }

    /**
     * won't tell you if the play was successful & will loop back to last song if already on the first.
     * If queue present, uses that, if not, relies on Song ID directly from DB
     */
    previous_song_looping() {
        let new_song: Song
        if (this.played_history.length > 0) {
            new_song = this.played_history.pop()!
        } else {
            let id_i = 0;
            while (this.db.songs[++id_i].id! < this.current_song_id);
            let next_id = -id_i;

            if (next_id == this.db.songs.length) next_id = this.db.songs[this.db.songs.length].id!
            new_song = this.db.songs.find((song) => song.id == next_id)!
        }
        const url = this.options?.use_only_pathname_url ? new_song.url.pathname : new_song.url.toString()
        this.new_song(url)
        this.play()
        //if (this.current_song) this.played_history.push(this.current_song)
        this.current_song_id = new_song.id!
        this.current_song = new_song
    }

    /**
     * Takes the song data from current song if no song ID is specified. Will return "ID - ID" if ID and current song doesn't exist
     * @returns {ARTIST}, {ARTIST2}... - {SONG NAME} ({REMIX ARTIST}, {REMIX ARTIST2}... remix)
     */
    format_current_song(id = this.current_song?.id) {

        const curr_song = this.db.songs.find((song) => song.id == id)
        if (!curr_song) {
            return "ID - ID"
        }
        let final_text = ""

        for (const artist of curr_song.artists) {
            const curr_artist = artist.get(this.db) as Artist
            final_text += curr_artist.name + ", "
        }

        final_text = final_text.slice(0, final_text.length - 2) // remove trailing ", "
        final_text += " - " + curr_song.name

        if (curr_song.remix_artists.length > 0) {
            final_text += " ("

            for (const artist of curr_song.remix_artists) {
                const curr_artist = artist.get(this.db) as Artist
                if (curr_artist.links && curr_artist.links.length > 0) {
                    final_text += curr_artist.name
                } else {
                    final_text += curr_artist.name + ", "
                }
            }

            final_text = final_text.slice(0, final_text.length - 2) // remove trailing ", "
            final_text += " Remix)"
        }

        return final_text
    }

    /**
     * Will add to queue, if ID is undefined nothing will happen. If ID already is in queue, nothing will happen. For more control use `try_queue_add()`
     */
    queue_add(id: number) {
        const curr_song = this.db.songs.find((song) => song.id == id)
        if (!curr_song) return
        if (this.queue.find((song) => song.id == id)) return
        this.queue.push(curr_song)
    }

    /**
     * Will add to queue. If ID is undefined throws error. if ID is already in queue, throws error.
     */
    try_queue_add(id: number) {
        const curr_song = this.db.songs.find((song) => song.id == id)
        if (!curr_song) throw new Error(`Song of id "${id}" doesn't exist`)
        if (this.queue.find((song) => song.id == id)) throw new Error(`Song of id "${id}" already queued`)
        this.queue.push(curr_song)
    }
    /**
     * Will add to queue. Unlike queue_add, if given ID is already in queue, it will move it to the end of the queue. Throws error if ID doesn't exist.
     */
    try_queue_append(id: number) {
        const curr_song = this.db.songs.find((song) => song.id == id)
        if (!curr_song) throw new Error(`Song of id "${id}" doesn't exist`)
        const i = this.queue.findIndex((song) => song.id == id)
        if (i != -1) this.queue.push(this.queue.splice(i, 1)[0])
        else this.queue.push(curr_song)
    }
    /**
     * Will add to queue. Unlike queue_add, if given ID is already in queue, it will move it to the end of the queue. If ID Doesn't exist, does nothing. For more control use try_queue_append()
     */
    queue_append(id: number) {
        const curr_song = this.db.songs.find((song) => song.id == id)
        if (!curr_song) return
        const i = this.queue.findIndex((song) => song.id == id)
        if (i != -1) this.queue.push(this.queue.splice(i, 1)[0])
        else this.queue.push(curr_song)
    }
    /**
     * Removes song of ID from queue and returns it. Does and returns nothing if song already not found.
     */
    queue_remove(id: number) {
        const i = this.queue.findIndex((song) => song.id == id)
        if (i == -1) return
        return this.queue.splice(i, 1)
    }

}
type BuilderOptions = {
    use_only_pathname_url?: boolean
}

class EuterpeBuilder {
    #audio_context: AudioContext
    #gain: GainNode
    #track: MediaElementAudioSourceNode
    #volume = 1
    #prev_node: any;

    #is_gain_connected = false
    /**
     * Creates a context and #gain( Gets connected at the end )
     * will throw if audio_element is undefined (stupid vue setup amirite?)
     * will throw if user has not interacted with the page yet (Can't initiate AudioContext)
     */
    constructor(private audio_element: HTMLAudioElement, private db: DB, private options?: BuilderOptions) {
        if (audio_element === undefined) throw Error("audio_element was undefined")
        //                                          ↓ For old browsers
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.#audio_context = new AudioContext()
        this.#track = this.#audio_context.createMediaElementSource(audio_element)
        this.#gain = this.#audio_context.createGain()
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {AnalyserNode}
     */
    add_analyser() {
        const analyser = this.#audio_context.createAnalyser()
        !this.#prev_node ? this.#track.connect(analyser) : this.#prev_node.connect(analyser)
        this.#prev_node = analyser
        return analyser
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {StereoPannerNode}
     */
    add_stereo_panner_node() {
        const panner = this.#audio_context.createStereoPanner()
        !this.#prev_node ? this.#track.connect(panner) : this.#prev_node.connect(panner)
        this.#prev_node = panner
        return panner
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {StereoPannerNode}
     */
    add_wave_shaper_node() {
        const shaper = this.#audio_context.createWaveShaper()
        !this.#prev_node ? this.#track.connect(shaper) : this.#prev_node.connect(shaper)
        this.#prev_node = shaper
        return shaper
    }
    /**
     * For additional trickery, you can connect your own node.
    */
    connect_custom_node(node: AudioNode) {
        !this.#prev_node ? this.#track.connect(node) : this.#prev_node.connect(node)
        this.#prev_node = node
    }
    /**
     * Only use if you need to connect the #gain before another node,
     * eg. if you want the analyser nodes output to be affected by user #gain
    */
    connect_gain() {
        !this.#prev_node ? this.#track.connect(this.#gain) : this.#prev_node.connect(this.#gain)
        this.#prev_node = this.#gain
        this.#is_gain_connected = true
    }
    /**
     * Finishes the build
     * @returns {Euterpe}
     */
    build() {
        if (!this.#is_gain_connected) {
            !this.#prev_node ? this.#track.connect(this.#gain) : this.#prev_node.connect(this.#gain)
            this.#prev_node = this.#gain
        }
        this.#prev_node.connect(this.#audio_context.destination)
        return new Euterpe(this.db, this.#audio_context, this.audio_element, this.#track, this.#gain, this.#volume, undefined, this.options)
    }
}
