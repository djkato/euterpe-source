export enum SubscribeEvents {
	CurrentTimeTick,
	FormattedDurationTick,
	FormattedCurrentTimeTick
}
class PubSub {
	//el = event listener
	el_current_time_tick: Array<(data: any) => void> = []
	el_formatted_duration_tick: Array<(data: any) => void> = []
	el_formatted_current_time_tick: Array<(data: any) => void> = []

	subscribe(event_name: SubscribeEvents, func: (data: any) => void) {
		switch (event_name) {
			case SubscribeEvents.CurrentTimeTick: {
				this.el_current_time_tick.push(func)
				break
			}
			case SubscribeEvents.FormattedDurationTick: {
				this.el_formatted_duration_tick.push(func)
				break
			}
			case SubscribeEvents.FormattedCurrentTimeTick: {
				this.el_formatted_current_time_tick.push(func)
				break
			}
		}
	}
	unsubscribe(event_name: SubscribeEvents, func: (data: any) => void) {
		switch (event_name) {
			case SubscribeEvents.CurrentTimeTick: {
				if (this.el_current_time_tick.includes(func)) {
					this.el_current_time_tick.splice(this.el_current_time_tick.indexOf(func), 1)
				}
				break
			}
			case SubscribeEvents.FormattedDurationTick: {
				if (this.el_formatted_duration_tick.includes(func)) {
					this.el_formatted_duration_tick.splice(this.el_formatted_duration_tick.indexOf(func), 1)
				}
				break
			}
			case SubscribeEvents.FormattedCurrentTimeTick: {
				if (this.el_formatted_duration_tick.includes(func)) {
					this.el_formatted_duration_tick.splice(this.el_formatted_duration_tick.indexOf(func), 1)
				}
				break
			}
		}
	}
	emit(event_name: SubscribeEvents, data: any) {
		switch (event_name) {
			case SubscribeEvents.CurrentTimeTick: {
				this.el_current_time_tick.forEach((func) => {
					func(data)
				})
				break
			}
			case SubscribeEvents.FormattedDurationTick: {
				this.el_formatted_duration_tick.forEach((func) => {
					func(data)
				})
				break
			}
			case SubscribeEvents.FormattedCurrentTimeTick: {
				this.el_formatted_current_time_tick.forEach((func) => {
					func(data)
				})
				break
			}
		}
	}
}

/* For old browsers */
declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext
	}
}

export class MusicPlayer {
	current_song_duration = 0
	#volume_cache: number
	is_playing = false
	time = 0
	#pub_sub = new PubSub()
	constructor(
		public audio_context: AudioContext,
		private audio_element: HTMLAudioElement,
		public track: MediaElementAudioSourceNode,
		public gain: GainNode,
		public volume: number,
		private current_song_path?: string
	) {
		this.#volume_cache = volume
	}

	mute_toggle() {
		if (this.gain.gain.value == 0) {
			this.unmute()
		} else {
			this.mute()
		}
	}
	mute() {
		this.#volume_cache = this.gain.gain.value
		/* Gentler mute, doesn't pop
		gain.gain.linearRampToValueAtTime(
			0,
			audio_context.currentTime + 0.1
		);*/
		this.volume = this.gain.gain.value = 0
	}
	unmute() {
		this.volume = this.gain.gain.value = this.#volume_cache
	}
	change_volume(volume_i: number) {
		this.volume = this.gain.gain.value = volume_i
	}
	/**
	 * Safer seek. Normal seek will try to start the player even if the track hasn't started yet, or was previously suspended/closed.
	 * will not resume playback
	 * @throws if "Can't seek - Audiocontext is not running"
	 */
	async try_seek(new_time: number) {
		if (this.audio_context.state !== "running") {
			this.is_playing = false
			throw new Error("Can't seek - audioContext not running, audio_context.state : " + this.audio_context.state)
		}
		this.audio_element.currentTime = new_time
	}

	/**
	 * Unsafe, throws error if failed. Use try_seek or seek unless you don't care about the result.
	 */
	seek(new_time: number) {
		this.audio_element.currentTime = new_time
	}

	/**
	 * Safer play_toggle. Normal play_toggle will try to start the player even if the track hasn't started yet, or was previously suspended/closed
	 * @throws Error if playback failed
	 */
	async try_play_toggle() {
		if (this.audio_context.state !== "running") {
			await this.audio_context.resume()
		}
		if (this.audio_element.paused) {
			try {
				await this.audio_element.play()
				this.is_playing = true
			} catch (e) {
				this.is_playing = false
				throw e
			}
		} else {
			this.audio_element.pause()
			this.is_playing = false
		}
	}

	/**
	 * Unsafe, can just fail. Use try_play_toggle unless you don't care about the result.
	 */
	play_toggle() {
		if (this.audio_element.paused) {
			this.is_playing = true
			this.audio_element.play().catch((r) => {
				this.is_playing = false
				throw r
			})
		} else {
			this.is_playing = false
			this.audio_element.pause()
		}
	}

	/**
	 * Safer play. Normal play will try to start the player even if the track hasn't started yet, or was previously suspended/closed
	 * @throws Error if playback failed
	 */
	async try_play() {
		if (this.is_playing) return
		if (this.audio_context.state !== "running") {
			await this.audio_context.resume()
		}
		if (this.audio_element.paused) {
			try {
				await this.audio_element.play()
				this.is_playing = true
			} catch (e) {
				this.is_playing = false
				throw e
			}
		}
	}

	/**
	 * Unsafe, can just fail. Use play or try_play unless you don't care about the result.
	 */
	play() {
		if (this.is_playing) return
		this.audio_element.play().catch(() => {
			this.is_playing = false
		})
	}

	/**
	 * Safe technically. Even if audioContext is suspended or closed it will pretend that it paused.
	 */
	pause() {
		this.audio_element.pause()
		this.is_playing = false
	}

	/**
	 * Will only load metadata of the upcoming song and change audio dom elements url. Need to call try_play() afterwards to start the playback
	 * @throws Error if adding element throwed Error or Stalled
	 */
	async try_new_song(path: string) {
		if (this.audio_context.state !== "running") {
			try {
				await this.audio_context.resume()
			} catch (e) {
				console.log("loading new song - couldn't resume context before hand", e)
			}
		}
		return new Promise<void>((resolve, reject) => {
			this.audio_element.src = this.current_song_path = path
			//Found out today about this. Such a nice new way to mass remove event listeners!
			const controller = new AbortController()

			this.audio_element.addEventListener(
				"canplaythrough",
				function canplay_listener() {
					controller.abort()
				},
				{ signal: controller.signal }
			)

			this.audio_element.addEventListener(
				"error",
				function error_listener() {
					controller.abort("new src error")
				},
				{ signal: controller.signal }
			)

			this.audio_element.addEventListener(
				"stalled",
				function stalled_listener() {
					controller.abort("new src stalled")
				},
				{ signal: controller.signal }
			)

			//once aborted, try to set current_song_duration
			controller.signal.addEventListener("abort", () => {
				this.current_song_duration = this.audio_element.duration
				if (typeof controller.signal.reason == "string") reject(new Error(controller.signal.reason))
				resolve()
			})

			this.is_playing = false
		})
	}
	/**
	 * Won't tell if you if the song actually got loaded or if it failed. For a safer version use try_new_song() unless you don't care about the result
	 */
	new_song(path: string) {
		this.audio_element.src = this.current_song_path = path
		this.current_song_duration = this.audio_element.duration
	}
	/**
	 * Will parse the duration of the song to make it easy to display in UI
	 * If somethings undefined it returns "0:00"
	 */
	get_formatted_duration() {
		const dur = this.audio_element.duration
		this.current_song_duration = this.audio_element.duration

		if (dur == 0 || !dur) return "0:00"

		// ~ is Bitwise NOT, equivalent to Math.floor()
		const hrs = ~~(dur / 3600)
		const mins = ~~((dur % 3600) / 60)
		const secs = ~~dur % 60

		let ret = ""
		if (hrs > 0) {
			ret += "" + hrs + ":" + (mins < 10 ? "0" : "")
		}

		ret += "" + mins + ":" + (secs < 10 ? "0" : "")
		ret += "" + secs
		return ret
	}
	/**
	 * Will parse the current time of the song to make it easy to display in UI
	 * If somethings undefined it returns "0:00"
	 */
	get_formatted_current_time() {
		const curr = this.audio_element.currentTime

		if (curr == 0 || !curr) return "0:00"
		// ~~ is Bitwise OR, equivalent to Math.floor()
		const hrs = ~~(curr / 3600)
		const mins = ~~((curr % 3600) / 60)
		const secs = ~~curr % 60

		let ret = ""
		if (hrs > 0) {
			ret += "" + hrs + ":" + (mins < 10 ? "0" : "")
		}

		ret += "" + mins + ":" + (secs < 10 ? "0" : "")
		ret += "" + secs
		return ret
	}
	#emit_time() {
		const request_id = requestAnimationFrame(this.#emit_time.bind(this))
		if (this.audio_element.ended) this.is_playing = false
		if (this.audio_element.paused) this.is_playing == false
		// if use reactively changes volume directly
		this.gain.gain.value = this.volume

		this.time = this.audio_element.currentTime
		if (this.#pub_sub.el_current_time_tick.length == 0) cancelAnimationFrame(request_id)
		this.#pub_sub.emit(SubscribeEvents.CurrentTimeTick, this.time)
	}
	#emit_duration_fmt() {
		const request_id = requestAnimationFrame(this.#emit_duration_fmt.bind(this))
		const time = this.get_formatted_duration()
		if (this.#pub_sub.el_formatted_duration_tick.length == 0) cancelAnimationFrame(request_id)
		this.#pub_sub.emit(SubscribeEvents.FormattedDurationTick, time)
	}
	#emit_time_fmt() {
		const request_id = requestAnimationFrame(this.#emit_time_fmt.bind(this))
		const time = this.get_formatted_current_time()
		if (this.#pub_sub.el_formatted_current_time_tick.length == 0) cancelAnimationFrame(request_id)
		this.#pub_sub.emit(SubscribeEvents.FormattedCurrentTimeTick, time)
	}
	/**
	 * Will give current time every animation frame
	 */
	on_time_tick(callback: (data: any) => void) {
		this.#pub_sub.subscribe(SubscribeEvents.CurrentTimeTick, callback)
		this.#emit_time()
	}

	/**
	 * Will give formatted current time via get_formatted_current_time() every animation frame
	 */
	on_time_tick_formatted(callback: (data: any) => void) {
		this.#pub_sub.subscribe(SubscribeEvents.FormattedCurrentTimeTick, callback)
		this.#emit_time_fmt()
	}
	/**
	 * Will give formatted duration time via get_formatted_duration() every animation frame
	 */
	on_duration_formatted(callback: (data: any) => void) {
		this.#pub_sub.subscribe(SubscribeEvents.FormattedDurationTick, callback)
		this.#emit_duration_fmt()
	}
}

export class MusicPlayerBuilder {
	#audio_context: AudioContext
	#gain: GainNode
	#track: MediaElementAudioSourceNode
	#volume = 1
	#prev_node: any
	#is_gain_connected = false
	/**
	 * Creates a context and #gain( Gets connected at the end )
	 * will throw if audio_element is undefined (stupid vue setup amirite?)
	 * will throw if user has not interacted with the page yet (Can't initiate AudioContext)
	 */
	constructor(private audio_element: HTMLAudioElement) {
		if (audio_element === undefined) throw Error("audio_element was undefined")
		//                                          ↓ For old browsers
		const AudioContext = window.AudioContext || window.webkitAudioContext
		this.#audio_context = new AudioContext()
		this.#track = this.#audio_context.createMediaElementSource(audio_element)
		this.#gain = this.#audio_context.createGain()
	}
	/**
	 * For external use, not kept inside player after connection.
	 * @returns {AnalyserNode}
	 */
	add_analyser() {
		const analyser = this.#audio_context.createAnalyser()
		!this.#prev_node ? this.#track.connect(analyser) : this.#prev_node.connect(analyser)
		this.#prev_node = analyser
		return analyser
	}
	/**
	 * For external use, not kept inside player after connection.
	 * @returns {StereoPannerNode}
	 */
	add_stereo_panner_node() {
		const panner = this.#audio_context.createStereoPanner()
		!this.#prev_node ? this.#track.connect(panner) : this.#prev_node.connect(panner)
		this.#prev_node = panner
		return panner
	}
	/**
	 * For external use, not kept inside player after connection.
	 * @returns {StereoPannerNode}
	 */
	add_wave_shaper_node() {
		const shaper = this.#audio_context.createWaveShaper()
		!this.#prev_node ? this.#track.connect(shaper) : this.#prev_node.connect(shaper)
		this.#prev_node = shaper
		return shaper
	}
	/**
	 * For additional trickery, you can connect your own node.
	 */
	connect_custom_node(node: AudioNode) {
		!this.#prev_node ? this.#track.connect(node) : this.#prev_node.connect(node)
		this.#prev_node = node
	}
	/**
	 * Only use if you need to connect the #gain before another node,
	 * eg. if you want the analyser nodes output to be affected by user #gain
	 */
	connect_gain() {
		!this.#prev_node ? this.#track.connect(this.#gain) : this.#prev_node.connect(this.#gain)
		this.#prev_node = this.#gain
		this.#is_gain_connected = true
	}
	/**
	 * Finishes the build
	 * @returns {Euterpe}
	 */
	build() {
		if (!this.#is_gain_connected) {
			!this.#prev_node ? this.#track.connect(this.#gain) : this.#prev_node.connect(this.#gain)
			this.#prev_node = this.#gain
		}
		this.#prev_node.connect(this.#audio_context.destination)
		return new MusicPlayer(this.#audio_context, this.audio_element, this.#track, this.#gain, this.#volume)
	}
}
