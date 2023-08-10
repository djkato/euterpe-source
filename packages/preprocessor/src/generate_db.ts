import { Collection, Ref, RefTo, Song, DB, } from "@euterpe.js/music-library"
import { songs } from "./songs_list"

export function generate_db() {
    console.log(songs)
    // construct db
    let db = new DB
    let collections: string[] = new Array()
    let new_songs = []

    //create collections by folder names
    for (let i = 0; i < songs.length; i++) {
        const song = songs[i]
        const last_i = song.lastIndexOf("\\")
        const collection_name = song.slice(song.slice(0, last_i).lastIndexOf("\\") + 1, last_i)
        /*
        const foreforelast_i = song.slice(0, forelast_i - 1)
        const foreforeforelast_i = song.slice(0, foreforelast_i - 1).lastIndexOf("\\")
        */
        if (!collections.includes(collection_name)) {
            console.log(`creating collection ${collection_name}`)
            db.add([new Collection({
                name: collection_name,
                songs: [],
                artists: [],
            })])
            collections.push(collection_name)
        }

        let col = db.collections.find(col => col.name == collection_name)!
        let col_id = col.id
        new_songs.push({ song: song, collection_id: col_id! })
    }

    //create songs
    for (let i = 0; i < new_songs.length; i++) {
        let song = new_songs[i]
        const last_i = song.song.lastIndexOf("\\")

        const name = song.song.slice(last_i + 1)
        const song_url = song.song.slice(song.song.indexOf("public\\") + 7)
        const db_song = new Song({
            name: name.slice(0, name.lastIndexOf(".")),
            artists: [],
            url: new URL(`${window.location.href}${song_url}`.replaceAll("\\", "/")),
            duration: 0,
            remix_artists: [],
            in_collection: new Ref(RefTo.Collections, song.collection_id)
        })
        db.add([db_song])
    }
    console.log(db)
    return db
}
