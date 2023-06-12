import { EuterpeBuilder, Library, Player } from "@euterpe.js/euterpe";
//export const euterpe = new
export const db = new Library.DB

db.add([
    //The IDs are added incrementally & are 0 based., so first artists ID added is 0, next 1 etc...
    //You can specify the ID manually if you want
    new Library.Artist({
        name: "Jamie xx",
    }),
    new Library.Artist({
        name: "janz",
    }),
    new Library.Artist({
        name: "Machinedrum",
    }),
    new Library.Artist({
        name: "Tanerélle",
    }),
    new Library.Artist({
        name: "Mono/Poly",
    }),
    new Library.Artist({
        name: "IMANU",
        links: [
            [Library.Platforms.Spotify, new URL("https://open.spotify.com/artist/5Y7rFm0tiJTVDzGLMzz0W1?si=DRaZyugTTIqlBHDkMGKVqA&nd=1")]
        ]
    }),
    new Library.Artist({
        name: "toe",
        id: 10
    }),
])
db.add([
    new Library.Song({
        //Refrences are constructed as such. This allows to get to the artist from either collection or song
        artists: [new Library.Ref(Library.RefTo.Artists, 2), new Library.Ref(Library.RefTo.Artists, 3), new Library.Ref(Library.RefTo.Artists, 4)],
        duration: 252,
        name: "Star",
        remix_artists: [new Library.Ref(Library.RefTo.Artists, 5)],
        url: new URL("http://127.0.0.1:4200/Machinedrum, Tanerelle & Mono Poly - Star (IMANU Remix) final.mp3")
    }),
    new Library.Song({
        //If you don't like guessing the IDs, then this is also a way to do it
        artists: [new Library.Ref(Library.RefTo.Artists, db.artists.find((a) => a.name == "Jamie xx")!.id!)],
        duration: 331,
        name: "Sleep Sound",
        url: new URL("http://127.0.0.1:4200/Jamie xx - Sleep Sound.mp3")
    }),
    new Library.Song({
        artists: [new Library.Ref(Library.RefTo.Artists, 1)],
        duration: 75,
        name: "wish",
        url: new URL("http://127.0.0.1:4200/janz - wish.mp3")
    }),
    new Library.Song({
        artists: [new Library.Ref(Library.RefTo.Artists, 10)],
        duration: 4 * 60 + 5,
        name: "サニーボーイ・ラプソディ",
        url: new URL("http://127.0.0.1:4200/16.サニーボーイ・ラプソディ.ogg")
    })
])

