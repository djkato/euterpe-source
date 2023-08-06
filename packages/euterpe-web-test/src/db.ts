import { DB, Song, Artist, Ref, RefTo, Platforms } from "@euterpe.js/music-library"
export const db = new DB

db.add([
    //The IDs are added incrementally & are 0 based., so first artists ID added is 0, next 1 etc...
    //You can specify the ID manually if you want
    new Artist({
        name: "Jamie xx",
    }),
    new Artist({
        name: "janz",
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
    }),
    new Artist({
        name: "toe",
        id: 10
    }),
])
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
    new Song({
        artists: [new Ref(RefTo.Artists, 1)],
        duration: 75,
        name: "wish",
        url: new URL("http://127.0.0.1:4200/janz - wish.mp3")
    }),
    new Song({
        artists: [new Ref(RefTo.Artists, 10)],
        duration: 4 * 60 + 5,
        name: "サニーボーイ・ラプソディ",
        url: new URL("http://127.0.0.1:4200/16.サニーボーイ・ラプソディ.ogg")
    })
])

