import { DB } from "@euterpe.js/music-library"
import { generate_db } from "./generate_db"
import { AudioVisualBuilder, SmoothingAlgorythm, ShapeType, WaveformOrientation, WaveformShape } from "@euterpe.js/visualizer"

document.getElementById("button")!.addEventListener("click", (ev) => {
    start()
})
export async function start() {
    analyze().then(async (result) => {
        console.log("Creating svgs...")
        const waveform_canvas = document.querySelector("#waveform-canvas") as SVGSVGElement
        for (const song of result.db.songs) {
            console.log("creating waveform for -> " + song.name)
            const waveform_visual_builder = new AudioVisualBuilder(result.analyzer_node, waveform_canvas)
                .set_fft_data_tresholds({ point_count_i: 100, fft_multiplier_i: 1, fft_offset_i: -80 })
                .set_fft_time_smoothing(0.8)
                .set_smoothing_algorythm(SmoothingAlgorythm.CatmullRom)
            const waveform_visual = waveform_visual_builder.build(ShapeType.Waveform, true, { fft_data: new Float32Array(new Float64Array(song.fft_data!)), orientation: WaveformOrientation.Horizontal, shape_type: WaveformShape.LineLike })
            waveform_visual.draw_once()
            await new Promise<void>((done) => setTimeout(() => done(), 300))
            // @ts-ignore
            song.metadata[0] = waveform_canvas.innerHTML
            song.fft_data = []
        }
        console.dir(result.db, { depth: null })
        download(JSON.stringify(result.db), "db.json", "text/plain")
    })
}
async function analyze(): Promise<AnalyzeReturn> {
    console.clear()
    const audioEl = document.querySelector("#audio") as HTMLAudioElement
    console.log("analysing...")
    const samplingRate = 100
    //Create all audio nodes
    const audioContext = new AudioContext()
    const track = audioContext.createMediaElementSource(audioEl)
    const gain = audioContext.createGain()
    gain.gain.value = 0
    const audioContextAnalyser = audioContext.createAnalyser()
    audioContextAnalyser.fftSize = 64
    audioContextAnalyser.smoothingTimeConstant = 0
    const analyserBufferLength = audioContextAnalyser.frequencyBinCount
    const FFTDataArray = new Float32Array(analyserBufferLength)
    //Connect all audio Nodes
    track.connect(audioContextAnalyser).connect(gain).connect(audioContext.destination)

    let db = generate_db()
    console.log(db)
    for (const song of db.songs) {
        // const song = db.songs[db.songs.length - 1]
        console.log(`Analyzing ${song.name}, ${db.songs.indexOf(song) + 1}/${db.songs.length}`)
        //if not loaded yet keep trying
        audioEl.src = song.url.href
        await awaitLoad(audioEl)
        song.duration = audioEl.duration
        let currentFFTData = []
        for (let curSecond = 0; curSecond < song.duration; curSecond += song.duration / samplingRate) {
            console.log("working...")
            audioEl.currentTime = curSecond
            await audioEl.play()
            await new Promise<void>((done) => setTimeout(() => done(), 100))
            audioContextAnalyser.getFloatFrequencyData(FFTDataArray)
            let volume = 0
            FFTDataArray.forEach((element) => {
                volume += element
            })
            currentFFTData.push(Math.round((volume / FFTDataArray.length) * 100) / 100)
        }
        song.fft_data = currentFFTData
    }
    console.log("Analyzation finished!")
    const result: AnalyzeReturn = { analyzer_node: audioContextAnalyser, db: db }
    return result
}
function download(content: BlobPart, fileName: string, contentType: string) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

type AnalyzeReturn = {
    analyzer_node: AnalyserNode,
    db: DB
}
function awaitLoad(audioEl: HTMLAudioElement) {
    return new Promise<void>((resolve, reject) => {
        audioEl.addEventListener("loadeddata", function () {
            if (audioEl.readyState >= 4) {
                resolve()
            }
        })
    })
}