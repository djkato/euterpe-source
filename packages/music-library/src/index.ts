export {
    RefTo,
    Ref,
    Song,
    Collection,
    DB,
    Artist,
    Platforms,
    CollectionType
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
    Release = "Release",
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
    Facebook = "Facebook",
}

class Ref {
    constructor(public to: RefTo, public id: ID) { }
    get(from: DB) {
        switch (this.to) {
            case RefTo.Artists: {
                return from.artists.find((artist) => artist.id == this.id)
            }
            case RefTo.Songs: {
                return from.songs.find((song) => song.id == this.id)
            }
            case RefTo.Collections: {
                return from.collections.find((col) => col.id = this.id)
            }
        }
    }
}
interface SongConstructor {
    name: string
    artists: Ref[]
    url: URL
    duration: number
    publish_date?: Date
    remix_artists?: Ref[]
    in_collection?: Ref
    cover?: URL
    bpm?: number
    key?: string
    fft_data?: number[]
    id?: ID,
    metadata: any
}
class Song {
    name: string
    artists: Ref[]
    url: URL
    duration: number
    remix_artists: Ref[]
    publish_date?: Date
    in_collection?: Ref
    cover?: URL
    bpm?: number
    key?: string
    fft_data?: number[]
    metadata: any
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
        this.metadata = data.metadata
    }
}

interface ArtistConstructor {
    name: string,
    pfp?: URL
    songs?: Ref[]
    collections?: Ref[]
    links?: [Platforms, URL][]
    id?: ID
    metadata: any
}
class Artist {
    name = ""
    pfp?: URL
    songs: Ref[]
    collections: Ref[]
    links?: [Platforms, URL][]
    metadata: any
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
        this.metadata = data.metadata
    }
}
interface CollectionConstructor {
    artists: Ref[]
    songs: Ref[]
    cover: URL
    duration: number
    publish_date?: Date
    id?: ID
    metadata: any
    name?: string
    type?: CollectionType

}
class Collection {
    name?: string
    type?: CollectionType
    artists: Ref[]
    songs: Ref[]
    cover: URL
    duration: number
    publish_date?: Date
    metadata: any
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
        this.metadata = data.metadata
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
    add(stuff: Artist[] | Collection[] | Song[] | (Song | Artist | Collection)[]) {
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
                this.artists.push(artist)

                for (const song_ref of artist.songs) {
                    const curr_song = song_ref.get(this) as Song
                    curr_song?.artists.push(new Ref(RefTo.Artists, artist.id))
                }

                for (const col_ref of artist.collections) {
                    const curr_col = col_ref.get(this) as Collection
                    curr_col?.artists.push(new Ref(RefTo.Artists, artist.id))
                }
            }

            else if (input instanceof Collection) {
                const col = input as Collection
                if (!col.id) col.id = this.collections.length
                this.collections.push(col)

                for (const song_ref of col.songs) {
                    const curr_song = song_ref.get(this) as Song
                    curr_song.in_collection = new Ref(RefTo.Collections, col.id)
                }
                for (const artist_ref of col.artists) {
                    const curr_artist = artist_ref.get(this) as Artist
                    curr_artist.collections.push(new Ref(RefTo.Collections, col.id))
                }

            }
            else if (input instanceof Song) {
                const song = input as Song
                if (!song.id) song.id = this.songs.length
                this.songs.push(song)

                if (song.in_collection) {
                    const curr_col = song.in_collection.get(this) as Collection
                    curr_col?.songs.push(new Ref(RefTo.Songs, song.id))
                }

                for (const artist_ref of song.artists) {
                    const curr_artist = artist_ref.get(this) as Artist
                    curr_artist.songs.push(new Ref(RefTo.Songs, song.id))
                }
            }
        }
        this.songs.sort((a, b) => a.id! - b.id!)
        this.collections.sort((a, b) => a.id! - b.id!)
        this.artists.sort((a, b) => a.id! - b.id!)
    }
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