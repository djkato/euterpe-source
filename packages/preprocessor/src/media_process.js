/**
 * TODO:
 * -add back -metadata
 *
 */

import filehound from "filehound"
import { execSync, exec } from 'child_process'
import { fstat, unlinkSync } from "fs"

function generate_new_photo_sizes(file, currentExtention) {
    exec(`start ffmpeg -y -i "${file}.${currentExtention}" -lossless 0 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_ogw.webp" -vf scale=1000:-1 -lossless 0 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_1000w.webp" -vf scale=800:-1 -lossless 0 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_800w.webp" -vf scale=500:-1 -lossless 0 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_500w.webp" -vf scale=320:-1 -lossless 0 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_320w.webp" -vf scale=-1:64,gblur=sigma=10:steps=2 -lossless 0 -compression_level 6 -quality 85 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_placeholder.webp"`)
}
function generate_new_anim_photo_sizes(file, currentExtention) {
    exec(`start ffmpeg -y -i "${file}.${currentExtention}" -lossless 0 -frames:v 1 -r 1 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_ogw_static.webp" -vf scale=1000:-1 -lossless 0 -frames:v 1 -r 1 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_1000w_static.webp" -vf scale=800:-1 -lossless 0 -frames:v 1 -r 1 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_800w_static.webp" -vf scale=500:-1 -lossless 0 -frames:v 1 -r 1 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_500w_static.webp" -vf scale=320:-1 -lossless 0 -frames:v 1 -r 1 -quality 85 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_320w_static.webp" -vf scale=-1:64,gblur=sigma=10:steps=2 -lossless 0 -frames:v 1 -r 1 -compression_level 6 -quality 85 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_placeholder_static.webp"`)
    exec(`start ffmpeg -y -i "${file}.${currentExtention}" -lossless 0 -quality 85 -loop 0 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_ogw.webp" -vf scale=1000:-1 -lossless 0 -quality 85 -loop 0 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_1000w.webp" -vf scale=800:-1 -lossless 0 -quality 85 -loop 0 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_800w.webp" -vf scale=500:-1 -lossless 0 -quality 85 -loop 0 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_500w.webp" -vf scale=320:-1 -lossless 0 -quality 85 -loop 0 -compression_level 6 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_320w.webp" -vf scale=-1:64,gblur=sigma=10:steps=2 -frames:v 1 -lossless 0 -c:v libwebp -compression_level 6 -quality 85 -metadata author="Djkáťo" -metadata copyright="https://djkato.net" "${file}_placeholder.webp"`)
}
function generate_new_sounds_ogg(file, currentExtention) {
    const path = file.substring(0, file.lastIndexOf("\\"))
    file = file.substring(file.lastIndexOf("\\") + 1)

    let command = ""
    command += `cd "${path}" && start cmd /k "`
    command += `ffmpeg -y -i "${file}.${currentExtention}" `
    command += `-c:a libopus -b:a 96k "${file}.ogg"`
    command += ` && exit"`
    exec(command)
    // console.log(command)
}
function generate_new_sounds_mp3(file, currentExtention) {
    const path = file.substring(0, file.lastIndexOf("\\"))
    file = file.substring(file.lastIndexOf("\\") + 1)

    let command = ""
    command += `cd "${path}" && start cmd /k "`
    command += `ffmpeg -y -i "${file}.${currentExtention}" `
    command += `-b:a 160k "${file}.mp3"`
    command += ` && exit"`
    exec(command)
    // console.log(command)
}
function generateNewVideoSizes(file, currentExtention, width_resolutions) {
    const path = file.substring(0, file.lastIndexOf("\\"))
    file = file.substring(file.lastIndexOf("\\") + 1)

    let command = ""
    command += `cd "${path}" && `
    command += `del ffmpeg2pass-0.log && `
    command += `ffmpeg -y -i "${file}.${currentExtention}" `
    command += `-vcodec libvpx-vp9 -cpu-used 0 -deadline good -quality good -g 240 -crf 42 -b:v 0 -c:a libopus -row-mt 1 -tile-rows 2 -tile-columns 4 -threads 16 -auto-alt-ref 6 `
    command += `-pass 1 -f webm NUL && exit`

    exec(command).once("exit", () => {
        for (const resolution of width_resolutions) {
            let res_command = ""
            res_command += `start cmd /k "`
            res_command += `cd "${path}" && `
            res_command += `ffmpeg -y -i "${file}.${currentExtention}" `
            res_command += `-vcodec libvpx-vp9 -cpu-used 0 -deadline good -quality good -g 240 -vf scale=${resolution}:-1 -crf 42 -b:v 0 -c:a libopus -row-mt 1 -tile-rows 2 -tile-columns 4 -threads 16 -auto-alt-ref 6 -pass 2 "${file}_${resolution}p.webm"`
            res_command += "&& exit\""
            exec(res_command)
        }
    })
}
let dirs = filehound.create()
    .path("../public/")
    .directory()
    .findSync()
console.log(dirs)

for (let i = 0; i < dirs.length; i++) {
    //gets current name file+ext
    let current_folder_files = filehound.create()
        .path(`${dirs[i]}`)
        .findSync()

    if (current_folder_files[0] != undefined) {
        //if previous encode was cancelled and 2pass log not removed, remove it :)
        if (current_folder_files[0].includes("ffmpeg2pass-0.log")) {
            try { unlinkSync(`${dirs[i]}/ffmpeg2pass-0.log`) } catch (err) { }
            current_folder_files = current_folder_files.slice(1)
        }
        for (let current_media of current_folder_files) {
            current_media = [current_media.substring(0, current_media.lastIndexOf(".")), current_media.substring(current_media.lastIndexOf(".") + 1)]
            if (current_media[1] == "wav") {
                console.log(`${current_media[0]}.${current_media[1]}\n`)

                generate_new_sounds_ogg(`${current_media[0]}`, `${current_media[1]}`)
                generate_new_sounds_mp3(`${current_media[0]}`, `${current_media[1]}`)
            }
            continue
            if (current_media[1] == "png" || current_media[1] == "jpg") {
                console.log(`.\\${current_media[0]}.${current_media[1]}\n`)

                generate_new_photo_sizes(`.\\${current_media[0]}`, `${current_media[1]}`)
            }
            else if (current_media[1] == "gif") {
                console.log(`.\\${current_media[0]}.${current_media[1]}\n`)

                generate_new_anim_photo_sizes(`.\\${current_media[0]}`, `${current_media[1]}`)
            }
            else if (current_media[1] == "webm" || current_media[1] == "mov" || current_media[1] == "avi" || current_media[1] == "mp4") {
                console.log(`Video: ${current_media[0]}.${current_media[1]}\n`)

                generateNewVideoSizes(`${current_media[0]}`, `${current_media[1]}`, [2560, 1080, 720, 480])

            }
        }
    }
}



