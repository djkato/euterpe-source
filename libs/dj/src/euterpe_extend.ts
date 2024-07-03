import { Euterpe } from "@euterpe.js/euterpe"
import { Song } from "@euterpe.js/music-library"
import { MusicPlayer } from "@euterpe.js/player"
export { DJ }
/**
 * To change volume of a track, use track[i].gain.gain, to change master volume, use euterpe/music players volume.
 * Make sure your master bpm isnt >= 300, on_beat will break cause there's a setTimeout of 200ms (60s/300BPM)
 */
class DJ {
	tracks: Track[] = []
	/**in ms */
	beat_duration?: number
	beat = { current: 0, max: 4, next_bar_in: 4 }
	on_beat?: (beat: { current: number; max: number; next_bar_in: number }) => void
	constructor(public player: Euterpe | MusicPlayer, public master_bpm: number | 120) {
		this.beat_duration = 60 / master_bpm
		this.#emit_beats()
	}
	#emit_beats() {
		this.beat.current >= 4 ? (this.beat.current++, this.beat.next_bar_in--) : ((this.beat.current = 0), (this.beat.next_bar_in = this.beat.max))

		if (this.on_beat) this.on_beat(this.beat)
		//This makes it break if BPM >= 300!!!!
		new Promise((resolve) => setTimeout(resolve, 200)).then(() => {
			requestAnimationFrame(this.#emit_beats.bind(this))
		})
	}
	create_track(song?: Song, should_loop = false) {
		this.tracks.push(new Track(this.player, song, should_loop))
	}
	/**
	 *
	 * @param i index of track
	 * @param delay how many beats in should the track start? 0 or undefined for asap, 2 = in two beats etc...
	 * @returns Promise<Error | self>
	 */
	async try_queue_track(track_i: number, delay: number) {
		return new Promise((resolve, reject) => {
			this.tracks[track_i].try_start(delay).then(
				() => resolve(this),
				(e) => reject(e)
			)
		})
	}
	/**
	 * Won't start playback, use try_queue_track() or try_start_track()
	 * @returns Promise<Error | self>
	 */
	async try_load_song_into_track(track_i: number, song: Song) {
		return new Promise((resolve, reject) => {
			this.tracks[track_i].change_song(song).then(
				() => resolve(this),
				(e) => reject(e)
			)
		})
	}
	/**
	 *
	 * @param i index of track
	 * @returns Promise<Error | self>
	 */
	async try_start_track(track_i: number) {
		return new Promise((resolve, reject) => {
			this.tracks[track_i].try_start().then(
				() => resolve(this),
				(e) => reject(e)
			)
		})
	}
	/**
	 * This function will have to restart every track, so for now implementatino pending c:
	 * @param new_master_bpm number in bpm
	 */
	set_master_bpm(new_master_bpm: number) {
		this.master_bpm = new_master_bpm
		this.beat_duration = 60 / this.master_bpm
	}
}

class Track {
	private audio_buffer?: AudioBuffer
	private buffer_source?: AudioBufferSourceNode
	gain: GainNode
	audio_context: AudioContext | BaseAudioContext

	constructor(public player: MusicPlayer | Euterpe, public current_song?: Song, public should_loop?: boolean) {
		this.audio_context = player.audio_context
		this.gain = this.audio_context.createGain()
		if (current_song) this.change_song(current_song).catch((e) => console.error("error during track construction - " + e))
	}

	async #prepare() {
		return new Promise((resolve, reject) => {
			if (!this.current_song) reject(new Error("No current song"))
			fetch(this.current_song!.url).then(
				async (file) => {
					this.audio_buffer = await this.audio_context.decodeAudioData(await file.arrayBuffer())
					resolve(this)
				},
				(reason) => reject(reason)
			)
		})
	}
	#connect() {
		if (!this.audio_buffer) throw new Error("Somehow buffer not in track even though it analyzed properly. Report this as a bug")
		this.buffer_source = this.audio_context.createBufferSource()
		this.buffer_source.buffer = this.audio_buffer!
		this.buffer_source.connect(this.gain)
		this.buffer_source.loop = this.should_loop || false
		this.gain.connect(this.player.gain)
	}
	async change_song(new_song: Song) {
		return new Promise((resolve, reject) => {
			this.current_song = new_song
			this.#prepare().then(
				() => {
					this.#connect()
					resolve(this)
				},
				(reason) => reject(reason)
			)
		})
	}
	/**
	 *
	 * @param delay in seconds
	 */
	async try_start(delay?: number) {
		return new Promise((resolve, reject) => {
			if (!this.buffer_source) reject(new Error("No buffer source yet, set a song first"))
			this.buffer_source!.start(this.audio_context.currentTime + (delay || 0))
		})
	}
}
