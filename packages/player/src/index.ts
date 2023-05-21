export enum SubscribeEvents {
    CurrentTimeTick,
    FormattedDurationTick,
    FormattedCurrentTimeTick,
}
const PubSub = () => {
    //el = event listener
    const el_current_time_tick: Array<(data: any) => void> = []
    const el_formatted_duration_tick: Array<(data: any) => void> = []
    const el_formatted_current_time_tick: Array<(data: any) => void> = []

    function subscribe(event_name: SubscribeEvents, func: (data: any) => void) {
        switch (event_name) {
            case SubscribeEvents.CurrentTimeTick: {
                el_current_time_tick.push(func)
                break
            }
            case SubscribeEvents.FormattedDurationTick: {
                el_formatted_duration_tick.push(func)
                break
            }
            case SubscribeEvents.FormattedCurrentTimeTick: {
                el_formatted_current_time_tick.push(func)
                break
            }
        }
    }
    function unsubscribe(event_name: SubscribeEvents, func: (data: any) => void) {
        switch (event_name) {
            case SubscribeEvents.CurrentTimeTick: {
                if (el_current_time_tick.includes(func)) {
                    el_current_time_tick.splice(el_current_time_tick.indexOf(func), 1)
                }
                break
            }
            case SubscribeEvents.FormattedDurationTick: {
                if (el_formatted_duration_tick.includes(func)) {
                    el_formatted_duration_tick.splice(el_formatted_duration_tick.indexOf(func), 1)
                }
                break
            }
            case SubscribeEvents.FormattedCurrentTimeTick: {
                if (el_formatted_duration_tick.includes(func)) {
                    el_formatted_duration_tick.splice(el_formatted_duration_tick.indexOf(func), 1)
                }
                break
            }
        }
    }
    function emit(event_name: SubscribeEvents, data: any) {
        switch (event_name) {
            case SubscribeEvents.CurrentTimeTick: {
                el_current_time_tick.forEach((func) => {
                    func(data)
                })
                break
            }
            case SubscribeEvents.FormattedDurationTick: {
                el_formatted_duration_tick.forEach((func) => {
                    func(data)
                })
                break
            }
            case SubscribeEvents.FormattedCurrentTimeTick: {
                el_formatted_current_time_tick.forEach((func) => {
                    func(data)
                })
                break
            }
        }
    }
    return {
        el_current_time_tick,
        el_formatted_duration_tick,
        el_formatted_current_time_tick,
        subscribe,
        unsubscribe,
        emit
    }
}

/* For old browsers */
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext
    }
}


export const MusicPlayer = (audio_context_i: AudioContext, audio_element_i: HTMLAudioElement, track_i: MediaElementAudioSourceNode, gain_i: GainNode, volume_i: number, current_song_path_i?: string) => {
    const audio_element: HTMLAudioElement = audio_element_i
    const audio_context: AudioContext = audio_context_i
    const track: MediaElementAudioSourceNode = track_i
    const gain: GainNode = gain_i
    let current_song_path: string | undefined = current_song_path_i
    let current_song_duration: number
    let volume_cache: number = volume_i
    let volume: number = volume_i
    let is_playing = false
    let time = 0
    const pub_sub = PubSub()

    function mute_toggle() {
        if (gain.gain.value == 0) {
            unmute()
        } else {
            mute()
        }
    }
    function mute() {
        volume_cache = gain.gain.value
        /* Gentler mute, doesn't pop
        gain.gain.linearRampToValueAtTime(
            0,
            audio_context.currentTime + 0.1
        );*/
        volume = gain.gain.value = 0
    }
    function unmute() {
        volume = gain.gain.value = volume_cache
    }
    function change_volume(volume_i: number) {
        volume = gain.gain.value = volume_i
    }
    /**
     * Safer seek_async. Normal seek will try to start the player even if the track hasn't started yet, or was previously suspended/closed
     */
    function try_seek_async(new_time: number) {
        return new Promise((resolve, reject) => {
            if (track.context.state == "closed" || track.context.state == "suspended") {
                is_playing = false
                reject("Can't seek - track not playing")
            }
            audio_element.currentTime = new_time
            resolve(null)
            /*audio_element.play().then((s) => resolve(s), (r) => {
                is_playing = false
                reject(r)
            })*/
        })
    }
    /**
    * Can try to seek even if the audio context was suspended or closed. Best to use try_seek_async()
    */
    function seek_async(new_time: number) {
        return new Promise((resolve, reject) => {
            audio_element.currentTime = new_time
            resolve(null)
            /* audio_element.play().then((s) => resolve(s), (r) => {
                is_playing = false
                reject(r)
            })*/
        })
    }
    /**
     * Unsafe, throws error if failed. Use try_seek_async or seek_async unless you don't care about the result.
     */
    function seek(new_time: number) {
        audio_element.currentTime = new_time
        audio_element.play().catch((e) => { throw e })
    }
    /**
    * Safer play_toggle_async. Normal play_toggle will try to start the player even if the track hasn't started yet, or was previously suspended/closed
    */
    function try_play_toggle_async() {
        return new Promise((resolve, reject) => {
            if (audio_context.state === "suspended" || audio_context.state === "closed") {
                reject("Context closed or suspended")
            }
            if (audio_element.paused) {
                audio_element.play().then((s) => {
                    is_playing = true
                    resolve(s)
                }, (r) => {
                    is_playing = false
                    reject(r)
                })
            } else {
                audio_element.pause()
                is_playing = false
                resolve(null)
            }
        })
    }
    /**
     * Can try to play even if the audio context was suspended or closed. Best to use try_play_toggle_async()
     */
    function play_toggle_async() {
        return new Promise((resolve, reject) => {
            if (audio_context.state === "suspended" || audio_context.state === "closed") {
                audio_context.resume()
            }
            if (audio_element.paused) {
                audio_element.play().then((s) => {
                    is_playing = true
                    resolve(s)
                }, (r) => {
                    is_playing = false
                    reject(r)
                })
            } else {
                audio_element.pause()
                is_playing = false
                resolve(null)
            }
        })
    }
    /**
    * Unsafe, throws error if failed. Use play_toggle_async or try_play_toggle_async unless you don't care about the result.
    */
    function play_toggle() {
        if (audio_element.paused) {
            is_playing = true
            audio_element.play().catch((r) => {
                is_playing = false
                throw r
            })
        } else {
            is_playing = false
            audio_element.pause()
        }
    }
    /**
    * Safer play_async. Normal play will try to start the player even if the track hasn't started yet, or was previously suspended/closed
    */
    function try_play_async() {
        return new Promise((resolve, reject) => {
            if (is_playing) reject(Error("Already playing"))
            if (audio_context.state === "suspended" || audio_context.state === "closed") {
                reject("Context closed or suspended")
            }
            audio_element.play().then((s) => {
                is_playing = true
                resolve(s)
            }, (r) => {
                is_playing = false
                reject(r)
            })
        })
    }
    /**
     * Will try to play even if the audio context was suspended or closed. Best to use try_play_async()
     */
    function play_async() {
        return new Promise((resolve, reject) => {
            if (is_playing) resolve(null)
            if (audio_context.state === "suspended" || audio_context.state === "closed") {
                audio_context.resume()
            }
            audio_element.play().then((s) => {
                is_playing = true
                resolve(s)
            }, (r) => {
                is_playing = false
                reject(r)
            })
        })
    }
    /**
    * Unsafe, throws error if failed. Use play_async or try_play_async unless you don't care about the result.
    */
    function play() {
        if (is_playing) return
        audio_element.play().catch((r) => {
            is_playing = false
            throw r
        })
    }
    /**
     * Safe technically. Even if audioContext is suspended or closed it will pretend that it paused.
    */
    function pause() {
        audio_element.pause()
        is_playing = false
    }
    /**
     * Will only load metadata of the upcoming song. Need to call try_play_async() afterwards to start the playback
     */
    function try_new_song_async(path: string) {
        return new Promise((resolve, reject) => {
            audio_element.src = current_song_path = path
            //Found out today about this. Such a nice new way to mass remove event listeners!
            const controller = new AbortController();

            audio_element.addEventListener("canplaythrough", function canplay_listener(s) {
                //current_song_duration = audio_element.duration
                controller.abort()
                resolve(s)
            }, { signal: controller.signal })

            audio_element.addEventListener("error", function error_listener(e) {
                controller.abort()
                reject(e)
            }, { signal: controller.signal })

            audio_element.addEventListener("abort", function abort_listener(e) {
                controller.abort()
                reject(e)
            }, { signal: controller.signal })

            audio_element.addEventListener("stalled", function stalled_listener(e) {
                controller.abort()
                reject(e)
            }, { signal: controller.signal })
            is_playing = false
        })
    }
    /**
     * Won't tell if you if the song actually got loaded or if it failed. For a safer version use try_new_song_async() unless you don't care about the result
     */
    function new_song(path: string) {
        audio_element.src = current_song_path = path
        //current_song_duration = audio_element.duration
    }
    /**
     * Will parse the duration of the song to make it easy to display in UI
     * If somethings undefined it returns "0:00"
     */
    function get_formatted_duration() {
        const dur = audio_element.duration
        current_song_duration = audio_element.duration

        if (dur == 0 || !dur) return "0:00"

        // ~ is Bitwise NOT, equivalent to Math.floor()
        const hrs = ~~(dur / 3600);
        const mins = ~~((dur % 3600) / 60);
        const secs = ~~dur % 60;

        let ret = ""
        if (hrs > 0) {
            ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }

        ret += "" + mins + ":" + (secs < 10 ? "0" : "");
        ret += "" + secs;
        return ret;
    }
    /**
     * Will parse the current time of the song to make it easy to display in UI
     * If somethings undefined it returns "0:00"
     */
    function get_formatted_current_time() {
        const curr = audio_element.currentTime

        if (curr == 0 || !curr) return "0:00"
        // ~~ is Bitwise OR, equivalent to Math.floor()
        const hrs = ~~(curr / 3600);
        const mins = ~~((curr % 3600) / 60);
        const secs = ~~curr % 60;

        let ret = ""
        if (hrs > 0) {
            ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }

        ret += "" + mins + ":" + (secs < 10 ? "0" : "");
        ret += "" + secs;
        return ret;
    }
    /**
     * Will give current time every animation frame
     */
    function subscribe_to_time_tick(callback: (data: any) => void) {
        pub_sub.subscribe(SubscribeEvents.CurrentTimeTick, callback)
        emit_current_time()
    }
    function emit_current_time() {
        const request_id = requestAnimationFrame(emit_current_time.bind(MusicPlayer))
        if (audio_element.ended) is_playing = false
        if (audio_element.paused) is_playing == false
        // if use reactively changes volume directly
        gain.gain.value = volume

        time = audio_element.currentTime
        if (pub_sub.el_current_time_tick.length == 0) cancelAnimationFrame(request_id)
        pub_sub.emit(SubscribeEvents.CurrentTimeTick, time)
    }
    /**
     * Will give formatted current time via get_formatted_current_time() every animation frame
     */
    function subscribe_to_formatted_current_time_tick(callback: (data: any) => void) {
        pub_sub.subscribe(SubscribeEvents.FormattedCurrentTimeTick, callback)
        emit_formatted_current_time()
    }
    function emit_formatted_current_time() {
        const request_id = requestAnimationFrame(emit_formatted_current_time.bind(MusicPlayer))
        const time = get_formatted_current_time()
        //if (pub_sub.el_formatted_current_time_tick.length == 0) cancelAnimationFrame(request_id)
        pub_sub.emit(SubscribeEvents.FormattedCurrentTimeTick, time)
    }
    /**
     * Will give formatted duration time via get_formatted_duration() every animation frame
     */
    function subscribe_to_formatted_duration_time(callback: (data: any) => void) {
        pub_sub.subscribe(SubscribeEvents.FormattedDurationTick, callback)
        emit_formatted_duration_time()
    }
    function emit_formatted_duration_time() {
        const request_id = requestAnimationFrame(emit_formatted_duration_time.bind(MusicPlayer))
        const time = get_formatted_duration()
        //if (pub_sub.el_formatted_duration_tick.length == 0) cancelAnimationFrame(request_id)
        pub_sub.emit(SubscribeEvents.FormattedDurationTick, time)
    }
    return {
        track,
        get_is_playing: () => is_playing,
        get_current_path: () => current_song_path,
        get_current_duration: () => current_song_duration,
        volume,
        time,
        mute,
        unmute,
        mute_toggle,
        change_volume,
        try_seek_async,
        seek_async,
        seek,
        play,
        pause,
        play_toggle,
        play_toggle_async,
        try_play_toggle_async,
        try_new_song_async,
        new_song,
        get_formatted_duration,
        get_formatted_current_time,
        subscribe_to_formatted_current_time_tick,
        subscribe_to_formatted_duration_time,
        subscribe_to_time_tick,
        try_play_async,
        play_async,
    }
}




export function MusicPlayerBuilder(audio_element: HTMLAudioElement) {
    let audio_context: AudioContext
    let gain: GainNode
    let track: MediaElementAudioSourceNode
    const volume = 1
    let prev_node: any;
    let is_gain_connected = false
    /**
     * Creates a context and gain( Gets connected at the end )
     * will throw if audio_element is undefined (stupid vue setup amirite?)
     * will throw if user has not interacted with the page yet (Can't initiate AudioContext)
     */
    function start() {
        if (audio_element === undefined) throw Error("audio_element was undefined")
        //                                          ↓ For old browsers
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audio_context = new AudioContext()
        track = audio_context.createMediaElementSource(audio_element)
        gain = audio_context.createGain()
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {AnalyserNode}
     */
    function add_analyser() {
        const analyser = audio_context.createAnalyser()
        !prev_node ? track.connect(analyser) : prev_node.connect(analyser)
        prev_node = analyser
        return analyser
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {StereoPannerNode}
     */
    function add_stereo_panner_node() {
        const panner = audio_context.createStereoPanner()
        !prev_node ? track.connect(panner) : prev_node.connect(panner)
        prev_node = panner
        return panner
    }
    /**
     * For external use, not kept inside player after connection.
     * @returns {StereoPannerNode}
     */
    function add_wave_shaper_node() {
        const shaper = audio_context.createWaveShaper()
        !prev_node ? track.connect(shaper) : prev_node.connect(shaper)
        prev_node = shaper
        return shaper
    }
    /**
     * For additional trickery, you can connect your own node.
    */
    function connect_custom_node(node: AudioNode) {
        !prev_node ? track.connect(node) : prev_node.connect(node)
        prev_node = node
    }
    /**
     * Only use if you need to connect the gain before another node,
     * eg. if you want the analyser nodes output to be affected by user gain
    */
    function connect_gain() {
        !prev_node ? track.connect(gain) : prev_node.connect(gain)
        prev_node = gain
        is_gain_connected = true
    }
    /**
     * Finishes the build
     * @returns {MusicPlayer: () => void}
     */
    function build() {
        if (!is_gain_connected) {
            !prev_node ? track.connect(gain) : prev_node.connect(gain)
            prev_node = gain
        }
        prev_node.connect(audio_context.destination)
        audio_element.preload = "metadata"
        return MusicPlayer(audio_context, audio_element, track, gain, volume)
    }
    return {
        start,
        add_analyser,
        add_stereo_panner_node,
        add_wave_shaper_node,
        connect_gain,
        connect_custom_node,
        build
    }
}