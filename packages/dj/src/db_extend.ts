import {
	Artist,
	Collection,
	DB,
	Ref,
	RefTo,
	Song
} from "@euterpe.js/music-library"
export { DJSong, DJDB }
type ID = number

interface SongConstructor {
	name: string
	artists?: Ref[]
	url: URL
	duration?: number
	publish_date?: Date
	remix_artists?: Ref[]
	in_collection?: Ref
	cover?: URL
	bpm?: number
	key?: string
	fft_data?: number[]
	id?: ID
	metadata?: any[]
}

class DJSong extends Song {
	audio_buffer?: AudioBuffer
	constructor(data: SongConstructor, audio_context?: AudioContext) {
		super(data)

		if (!audio_context) return
		try {
			fetch(data.url).then((file) => {
				file.arrayBuffer().then((buffer) => {
					audio_context
						.decodeAudioData(buffer)
						.then((audio_buffer) => {
							this.audio_buffer = audio_buffer
						})
				})
			})
		} catch (e) {
			console.error(new Error("Failed to preprocess DJSong. " + e))
		}
	}
	public async analyze(url: URL, audio_context: AudioContext) {
		this.audio_buffer = await audio_context.decodeAudioData(
			await (await fetch(url)).arrayBuffer()
		)
	}
}
class DJDB extends DB {
	dj_add(dj_songs: DJSong[]): void {
		let inputs
		typeof dj_songs[Symbol.iterator] == "function"
			? (inputs = dj_songs)
			: (inputs = [dj_songs])
		for (const input of inputs) {
			if (input instanceof DJSong) {
				const song = input as DJSong
				if (!song.id) song.id = this.songs.length

				if (song.in_collection) {
					const curr_col = song.in_collection.get(this) as Collection
					curr_col.songs.push(new Ref(RefTo.Songs, song.id))
					song.artists.forEach((artist) =>
						curr_col.artists.push(
							new Ref(RefTo.Artists, artist.get(this)!.id!)
						)
					)
					song.remix_artists.forEach((artist) =>
						curr_col.artists.push(
							new Ref(RefTo.Artists, artist.get(this)!.id!)
						)
					)
				}

				for (const artist_ref of song.artists) {
					const curr_artist = artist_ref.get(this) as Artist
					curr_artist.songs.push(new Ref(RefTo.Songs, song.id))
				}

				for (const artist_ref of song.remix_artists) {
					const curr_artist = artist_ref.get(this) as Artist
					curr_artist.songs.push(new Ref(RefTo.Songs, song.id))
				}

				this.songs.push(song)
			}
		}
	}
}
