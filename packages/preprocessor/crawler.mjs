import filehound from "filehound"
import fs from "fs"
const songs = filehound.create().path("./public/samples").ext(["ogg", "mp3"]).findSync()
fs.writeFile('./src/songs_list.ts', `export const songs = ` + JSON.stringify(songs), 'utf8', () => { 1 + 1 })