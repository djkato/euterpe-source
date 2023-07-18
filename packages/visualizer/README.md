# Visualizer
![example](https://cdn.discordapp.com/attachments/1108067171122282641/1130983369619026050/firefox_krQG16y1rS.gif)
Euterpe Visualizer is a unique audio visual library for the web. Using SVG elements instead of canvas, it allows to leverage the power of GPU to do the actual drawing, unlike canvas, which is purely cpu. It is fully customizable with build parameters and through CSS, as the visuals are just `<path>` elements that update every frame.

### How to use

This library relies on AudioContext API, especially on AnalyserNode. To use the Visualizer without our player, first we need to create an AudioContext, from which we can create and connect an AnalyserNode:
```js
import { AudioVisualBuilder, SmoothingAlgorythm, ShapeType } from "@euterpe/visualizer"
// Refrence to an <audio id="audio"></audio> element inside your HTML
const audio_element = document.querySelector("#audio") as HTMLAudioElement
// Don't forget to set the song URI and wait for user input before initialising the AudioContext
const audio_context = new AudioContext()
const track = audio_context.createMediaElementSource(audio_element)
const analyzer = audio_context.createAnalyser()
track.connect(analyzer).connect(audio_context.destination)
```
Now that the AudioContext is ready, we start constructing our Visualizer
```js
// For more options during the building process, I recommend reading the docs
/* Refrence an
 * "<svg id="canvas" viewBox="0 0 500 500" preserveAspectRatio="none" ></svg>"
 * element inside your HTML
*/
const visualizer = new AudioVisualBuilder(analyser_node, document.querySelector("#canvas") as SVGSVGElement)
    .build(ShapeType.Circle)
```
And it's ready! Once the audio context starts playing, the visualizer should start generating the path inside our SVG element.
```js
visualizer.draw()
audio_element.play()
```
This is a minimal setup, and more options during the build process are recommended. Especially the `.set_fft_data_tresholds()` method, as each setting affects another. There's really no scientific method to this for now unfortunately, so some trial and error will be necessary.

#### How to use with Euterpe Player

##### Full demo on how to use together with Euterpe player at [github](https://github.com/euterpe-js/euterpe-source/tree/master/packages/visualizer-web-test).

First we need to create our [Euterpe Player](https://www.npmjs.com/package/@euterpe.js/player)
```js
import { MusicPlayerBuilder } from "@euterpe/player";
import { AudioVisualBuilder, SmoothingAlgorythm, ShapeType } from "@euterpe/visualizer"

const audio_el = document.querySelector("#audio") as HTMLAudioElement
const music_player_builder = MusicPlayerBuilder(audio_el)
music_player_builder.start()
// Here we create our Analyzer node for analyzer user
const analyzer_node = music_player_builder.add_analyser()
const music_player = music_player_builder.build()

```
Now that the AudioContext is ready, we start constructing our Visualizer
```js
// For more options during the building process, I recommend reading the docs
/* Refrence an
 * "<svg id="canvas" viewBox="0 0 500 500" preserveAspectRatio="none" ></svg>"
 * element inside your HTML
*/
const visual_builder = new AudioVisualBuilder(analyzer_node, document.querySelector("#canvas") as SVGSVGElement)
    //Because the to_fft_range is so low, it needs more FFT data.
    .set_fft_size(8192)
    //Tells the Visualiser how to parse data which mutates our initial shape
    .set_fft_data_tresholds({ to_fft_range_i: 3, point_count_i: 40, fft_multiplier_i: 1.5, fft_offset_i: 150 })
    .set_fft_time_smoothing(0.6)
    //If not using typescript enums, CatmullRom = number 2
    .set_smoothing_algorythm(SmoothingAlgorythm.CatmullRom)

const visualizer = visual_builder.build(ShapeType.Circle)
```
And it's ready! Once the audio context starts playing, the visualizer should start generating the path inside our SVG element.
```js
visualizer.draw()

music_player.try_new_song_async(url)
    .then( music_player.play_async()
        .then(
            console.log("It's working!")
        )
    )
```