export {
	RefTo,
	Ref,
	Song,
	Collection,
	DB,
	Artist,
	Platforms,
	CollectionType,
	from_json
}
type ID = number
enum RefTo {
	Artists,
	Songs,
	Collections
}
enum CollectionType {
	Album = "Album",
	EP = "EP",
	Single = "Single",
	Playlist = "Playlist",
	Release = "Release"
}
enum Platforms {
	Youtube = "Youtube",
	Linktree = "Linktree",
	Bandcamp = "Bandcamp",
	Spotify = "Spotify",
	Portfolio = "Portfolio",
	BeatPort = "BeatPort",
	SoundCloud = "SoundCloud",
	Instagram = "Instagram",
	Patreon = "Patreon",
	Twitter = "Twitter",
	Facebook = "Facebook"
}

class Ref {
	constructor(public to: RefTo, public id: ID) {}
	get(from: DB) {
		switch (this.to) {
			case RefTo.Artists: {
				return from.artists.find((artist) => artist.id == this.id)
			}
			case RefTo.Songs: {
				return from.songs.find((song) => song.id == this.id)
			}
			case RefTo.Collections: {
				return from.collections.find((col) => col.id == this.id)
			}
		}
	}
}
function ref_from_json(ref: any): Ref {
	return new Ref(ref.to, ref.id)
}

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
class Song {
	name: string
	artists: Ref[]
	url: URL
	duration?: number
	remix_artists: Ref[]
	publish_date?: Date
	in_collection?: Ref
	cover?: URL
	bpm?: number
	key?: string
	fft_data?: number[]
	metadata: any[]
	/**
	 * The ID is always there, don't worry :)
	 */
	id?: ID
	constructor(data: SongConstructor) {
		this.name = data.name
		this.artists = data.artists || []
		this.url = data.url
		this.duration = data.duration
		this.publish_date = data.publish_date
		this.remix_artists = data.remix_artists || []
		this.in_collection = data.in_collection
		this.cover = data.cover
		this.bpm = data.bpm
		this.key = data.key
		this.fft_data = data.fft_data
		this.id = data.id
		this.metadata = data.metadata || []
	}
}

interface ArtistConstructor {
	name: string
	pfp?: URL
	songs?: Ref[]
	collections?: Ref[]
	links?: [Platforms, URL][]
	id?: ID
	metadata?: any[]
}
class Artist {
	name = ""
	pfp?: URL
	songs: Ref[]
	collections: Ref[]
	links?: [Platforms, URL][]
	metadata: any[]
	/**
	 * The ID is always there, don't worry :)
	 */
	id?: ID
	constructor(data: ArtistConstructor) {
		this.name = data.name
		this.pfp = data.pfp
		this.songs = data.songs || []
		this.collections = data.collections || []
		this.links = data.links
		this.id = data.id
		this.metadata = data.metadata || []
	}
}
interface CollectionConstructor {
	artists: Ref[]
	songs: Ref[]
	cover?: URL
	duration?: number
	publish_date?: Date
	id?: ID
	metadata?: any[]
	name?: string
	type?: CollectionType
}
class Collection {
	name?: string
	type?: CollectionType
	artists: Ref[]
	songs: Ref[]
	cover?: URL
	duration?: number
	publish_date?: Date
	metadata: any[]
	/**
	 * The ID is always there, don't worry :)
	 */
	id?: ID
	constructor(data: CollectionConstructor) {
		this.artists = data.artists
		this.songs = data.songs
		this.cover = data.cover
		this.duration = data.duration
		this.publish_date = data.publish_date
		this.id = data.id
		this.name = data.name
		this.metadata = data.metadata ? data.metadata : []
	}
}
class DB {
	artists: Artist[] = []
	songs: Song[] = []
	collections: Collection[] = []

	add(song: Song[]): void
	add(artist: Artist[]): void
	add(collection: Collection[]): void
	add(mix: (Song | Artist | Collection)[]): void
	add(
		stuff: Artist[] | Collection[] | Song[] | (Song | Artist | Collection)[]
	) {
		/** All of this adds refrences to the other side of whatever is being added.
		 *  eg. adding song with refrence to artist, adds refrence of song to artist
		 * and adds incremental ids
		 */
		let inputs
		if (typeof stuff[Symbol.iterator] != "function") {
			inputs = [stuff]
		} else {
			inputs = stuff
		}
		for (const input of inputs) {
			if (input instanceof Artist) {
				const artist = input as Artist
				if (!artist.id) artist.id = this.artists.length

				for (const song_ref of artist.songs) {
					const curr_song = song_ref.get(this) as Song
					curr_song?.artists.push(new Ref(RefTo.Artists, artist.id))
				}

				for (const col_ref of artist.collections) {
					const curr_col = col_ref.get(this) as Collection
					curr_col?.artists.push(new Ref(RefTo.Artists, artist.id))
				}
				this.artists.push(artist)
			} else if (input instanceof Collection) {
				const col = input as Collection
				if (!col.id) col.id = this.collections.length

				for (const song_ref of col.songs) {
					const curr_song = song_ref.get(this) as Song
					curr_song.in_collection = new Ref(RefTo.Collections, col.id)
				}
				for (const artist_ref of col.artists) {
					const curr_artist = artist_ref.get(this) as Artist
					curr_artist.collections.push(
						new Ref(RefTo.Collections, col.id)
					)
				}
				this.collections.push(col)
			} else if (input instanceof Song) {
				const song = input as Song
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
		this.songs.sort((a, b) => a.id! - b.id!)
		this.collections.sort((a, b) => a.id! - b.id!)
		this.artists.sort((a, b) => a.id! - b.id!)
	}
}
function from_json(db_stringified: {
	artists?: any
	songs?: any
	collections?: any
}): DB {
	const db = new DB()
	if (db_stringified.artists) {
		for (const artist of db_stringified.artists) {
			if (artist.songs)
				artist.songs = artist.songs.map((e: any) => ref_from_json(e))
			if (artist.collections)
				artist.collections = artist.collections.map((e: any) =>
					ref_from_json(e)
				)
			if (artist.links)
				artist.links = artist.links.map((e: any) => {
					try {
						;[e[0] as Platforms, new URL(e[1])]
					} catch (e) {
						console.log(e)
					}
				})
			if (artist.publish_date)
				artist.publish_date = new Date(JSON.parse(artist.publish_date))
			if (artist.id) artist.id = artist.id as ID
			try {
				if (artist.pfp) artist.pfp = new URL(artist.pfp)
			} catch (e) {
				console.error(e), console.error("failed to parse artist URL")
			}
			db.artists.push(artist)
		}
	}
	if (db_stringified.songs) {
		for (const song of db_stringified.songs) {
			try {
				if (song.url) song.url = new URL(song.url)
			} catch (e) {
				console.error("failed to parse song.url" + e)
			}
			if (song.artists)
				song.artists = song.artists.map((e: any) => ref_from_json(e))
			if (song.remix_artists)
				song.remix_artists = song.remix_artists.map((e: any) =>
					ref_from_json(e)
				)
			if (song.in_collection)
				song.in_collection = ref_from_json(song.in_collection)
			try {
				if (song.cover) song.cover = new URL(song.cover)
			} catch (e) {
				console.error(e), console.error("failed to parse artist URL")
			}
			try {
				if (song.publish_date)
					song.publish_date = new Date(JSON.parse(song.publish_date))
			} catch (e) {
				console.error(e), console.error("Failed to song cover url")
			}
			if (song.id) song.id = song.id as ID
			db.songs.push(song)
		}
	}
	if (db_stringified.collections) {
		for (const collection of db_stringified.collections) {
			if (collection.artists)
				collection.artists = collection.artists.map((e: any) =>
					ref_from_json(e)
				)
			if (collection.songs)
				collection.songs = collection.songs.map((e: any) =>
					ref_from_json(e)
				)
			if (collection.type)
				collection.type = collection.type.map(
					(e: any) => e as CollectionType
				)
			try {
				if (collection.publish_date)
					collection.publish_date = new Date(
						JSON.parse(collection.publish_date)
					)
			} catch (e) {
				console.error(e), console.error("Failed to parse date")
			}
			try {
				if (collection.cover)
					collection.cover = new URL(collection.cover)
			} catch (e) {
				console.error(e),
					console.error("failed to parse collection cover url")
			}
			if (collection.id) collection.id = collection.id as ID
			db.collections.push(collection)
		}
	}
	return db
}
// const db = new DB
// db.add(
//     new Artist({
//         name: "djkato",
//     })
// )
// db.add(
//     new Song({
//         name: "Hihaa",
//         artists: [new Ref(RefTo.Artists, db.artists.find((a) => a.name == "djkato")!.id!)],
//         duration: 123,
//         url: new URL("http://Smt.com/efsse.mp3")
//     })
// )
// console.dir(db, { depth: null })

// const res = db.artists[0].songs[0].get(db) as Song
// console.log(`${db.artists[0].name} has song ${db.songs[0].name}? : ${res.name} is there!`)
