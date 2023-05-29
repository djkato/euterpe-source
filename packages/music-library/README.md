# music-library

A simple music library, acting as a Local DB as JS Object. Contains everything a person would need to store their music data for website playback.

## How to use:

#### Simple demo using euterpe player [here](https://github.com/euterpe-js/euterpe-source/tree/master/packages/music-library-web-test)

Recommended to make a db.ts file where one instanciates their database, then exports it for use elsewhere.

`db.ts`
```ts
import { DB, Artist, Song, RefTo, Ref, Platforms } from "@euterpe/music-library";
export const db = new DB

db.add([
    //The IDs are added incrementally & are 0 based., so first artists ID added is 0, next 1 etc...
    //You can specify the ID manually if you want
    new Artist({
        name: "Jamie xx",
    }),
    new Artist({
        name: "Machinedrum",
    }),
    new Artist({
        name: "Tanerélle",
    }),
    new Artist({
        name: "Mono/Poly",
    }),
    new Artist({
        name: "IMANU",
        links: [
            [Platforms.Spotify, new URL("https://open.spotify.com/artist/5Y7rFm0tiJTVDzGLMzz0W1?si=DRaZyugTTIqlBHDkMGKVqA&nd=1")]
        ]
    })])
db.add([
    new Song({
        //Refrences are constructed as such. This allows to get to the artist from either collection or song
        artists: [new Ref(RefTo.Artists, 2), new Ref(RefTo.Artists, 3), new Ref(RefTo.Artists, 4)],
        duration: 252,
        name: "Star",
        remix_artists: [new Ref(RefTo.Artists, 5)],
        url: new URL("http://127.0.0.1:4200/Machinedrum, Tanerelle & Mono Poly - Star (IMANU Remix) final.mp3")
    }),
    new Song({
        //If you don't like guessing the IDs, then this is also a way to do it
        artists: [new Ref(RefTo.Artists, db.artists.find((a) => a.name == "Jamie xx")!.id!)],
        duration: 331,
        name: "Sleep Sound",
        url: new URL("http://127.0.0.1:4200/Jamie xx - Sleep Sound.mp3")
    }),
])
```
And then we can easily get any data we want elsewhere, like:
`main.ts`
```ts
import { db } from "./db";

let curr_song_id = 1;
// Some buttons in the DOM to act on the library, snippet is using euterpe-js/player
document.querySelector("#previous")?.addEventListener("click", () => {
    curr_song_id--
    if (curr_song_id < 0) curr_song_id = 2
    music_player.try_new_song_async(db.songs[curr_song_id].url.pathname).then((s) => {
        change_current_song_text(db)
        music_player.play_async().catch((err) => { console.log(err) })
    }, (e) => { console.log(e) })
})
document.querySelector("#next")?.addEventListener("click", () => {
    curr_song_id++
    if (curr_song_id > 2) curr_song_id = 0
    music_player.try_new_song_async(db.songs[curr_song_id].url.pathname).then((s) => {
        change_current_song_text(db)
        music_player.play_async().catch((err) => { console.log(err) })
    }, (e) => { console.log(e) })
})
```
Example on how to produce final titles:
 * If the current song has multiple titles, add them with `, ` between, then append " - " and song name.
 * If the song has remix artists, we add a " (", add all artists with ", " between, and even make them link to artists' links if there are some.
 * Results with given db:
        - `Machinedrum, Tanerélle, Mono/Poly - Star (<a href="{{spotify link}}">IMANU</a> Remix)`
        - `Jamie xx - Sleep Sound`
```ts
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
```
What data this database stores right now:
```ts
class Song {
    name: string
    artists: Ref[] //Ref(RefTo.Artist, {ID})
    url: URL
    duration: number
    remix_artists: Ref[] //Ref(RefTo.Artist, {ID})
    publish_date?: Date
    in_collection?: Ref //Ref(RefTo.Collection, {ID})
    cover?: URL
    bpm?: number
    key?: string
    fft_data?: number[]
    id?: ID
}
class Artist {
    name = ""
    pfp?: URL
    songs: Ref[] //Ref(RefTo.Song, {ID})
    collections: Ref[] //Ref(RefTo.Collection, {ID})
    links?: [Platforms, URL][]
    id?: ID
}
//can be used as EP, Album etc...
class Collection {
    artists: Ref[] //Ref(RefTo.Artist, {ID})
    songs: Ref[] //Ref(RefTo.Song, {ID})
    cover: URL
    duration: number
    publish_date?: Date
    id?: ID
}
```