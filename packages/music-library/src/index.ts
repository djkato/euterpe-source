import { writeFile, readFile } from "node:fs"
type ID = number
type URL = string
enum RefTo {
    Artists,
    Songs,
    Collections
}
enum Platforms {
    Youtube,
    Linktree,
    Bandcamp,
    Spotify,
    Portfolio,
    BeatPort,
    SoundCloud,
}
type Ref<T> = [T, ID]

type Song = {
    id: ID,
    name: string,
    artists: Ref<RefTo.Artists>[],
    url: URL,
    publish_date?: Date,
    remix_artists?: Ref<RefTo.Artists>[],
    in_collection?: Ref<RefTo.Collections>,
    cover?: URL,
    duration: number,
    bpm?: number,
    key?: string,
    fft_data?: number[]
}
type Artist = {
    id: ID,
    name: string,
    pfp?: URL,
    songs?: Ref<RefTo.Songs>[],
    collections?: Ref<RefTo.Collections>[],
    links: [Platforms, URL][],
}
type Collection = {
    id: ID,
    publish_date?: Date,
    artists: Ref<RefTo.Artists>[],
    songs: Ref<RefTo.Songs>[],
    cover: URL,
    duration: number,
}
type DB = {
    artists?: Artist[],
    songs?: Song[],
    Collections?: Collection[],
}
const db: DB = {}
db.songs?.push(
    {
        id: 0,
        artists: [RefTo.Artists, 0] as Ref<RefTo.Artists>,
        duration: 13,
        songs: [RefTo.Songs, 0] as Ref<RefTo.Songs>,
        name: "Just the two of us",
        url: "Huehue" as URL,

    } as Song)