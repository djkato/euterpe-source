export enum SmoothingAlgorythm {
	Linear,
	BezierPerpendicular,
	CatmullRom,
	BezierWeighted
}
export enum ShapeType {
	Circle,
	Line,
	Waveform
	/*To be Implmeneted
	Custom,
	FullSongWaveForm
	*/
}
export enum WaveformOrientation {
	Vertical,
	Horizontal
}
export enum WaveformShape {
	LineLike,
	Striped
}
export type WaveformOptions = {
	fft_data: Float32Array
	shape_type: WaveformShape
	orientation: WaveformOrientation
}
type Point = {
	x: number
	y: number
}
type Shape = {
	shape_type: ShapeType
	//Algo-rythm, because this is about music. Get it? xd
	smoothing_algorythm: SmoothingAlgorythm
	points: Point[]
	waveform_options?: WaveformOptions
	symmetry?: boolean
}

export class AudioVisual {
	#analyzer_node
	#svg_injecting_element
	#shape
	#buffer_length
	#fft_multiplier
	#fft_offset
	#from_fft_range
	#to_fft_range
	#point_count
	#canvas_height
	#canvas_width
	#fft_data
	#subscriber_fns = new Array<(data: Float32Array) => void>()
	constructor(
		analyzer_node: AnalyserNode,
		svg_injecting_element: SVGSVGElement,
		shape: Shape,
		buffer_length: number,
		fft_multiplier: number,
		fft_offset: number,
		from_fft_range: number,
		to_fft_range: number,
		point_count: number
	) {
		this.#analyzer_node = analyzer_node
		this.#svg_injecting_element = svg_injecting_element
		this.#shape = shape
		this.#buffer_length = buffer_length
		this.#fft_multiplier = fft_multiplier
		this.#fft_offset = fft_offset
		this.#from_fft_range = from_fft_range
		this.#to_fft_range = to_fft_range
		this.#point_count = point_count

		this.#fft_data = new Float32Array(this.#analyzer_node.frequencyBinCount)
		this.#canvas_width = svg_injecting_element.viewBox.baseVal.width
		this.#canvas_height = svg_injecting_element.viewBox.baseVal.height
	}

	#get_cured_frequency_data(): Array<number> {
		let buffer_length_cache
		if (this.#shape.shape_type == ShapeType.Waveform) {
			this.#fft_data = this.#shape.waveform_options!.fft_data
			buffer_length_cache = this.#buffer_length
			this.#buffer_length = this.#fft_data.length
		} else {
			this.#analyzer_node.getFloatFrequencyData(this.#fft_data)
		}
		const from = Math.round((this.#point_count / 100) * this.#from_fft_range)
		const to = Math.round(this.#buffer_length - (this.#buffer_length / 100) * this.#to_fft_range)
		const squeeze_factor = Math.round((this.#buffer_length - to) / this.#point_count)

		const return_array = new Array(this.#point_count)
		for (let i = 0; i < this.#point_count + 1; i++) {
			return_array[i] = this.#fft_data[from + i * squeeze_factor]
		}
		return return_array
	}

	#normalise_perpendicular_anchors(x: number, y: number) {
		const magnitude = Math.sqrt(x * x + y * y)
		return [x / magnitude, y / magnitude]
	}

	#create_perpendicular_anchors(arr: { x: number; y: number }[]) {
		const anchors = []
		switch (this.#shape.shape_type) {
			case ShapeType.Circle: {
				const pointDistance = 7
				for (let curPoint = 0; curPoint < arr.length; curPoint++) {
					const [dx, dy] = this.#normalise_perpendicular_anchors(arr[curPoint].x, arr[curPoint].y)
					const perpendicular = [-dy, dx]
					anchors.push({
						leftAnchor: {
							x: arr[curPoint].x + pointDistance * perpendicular[0],
							y: arr[curPoint].y + pointDistance * perpendicular[1]
						},
						rightAnchor: {
							x: arr[curPoint].x - pointDistance * perpendicular[0],
							y: arr[curPoint].y - pointDistance * perpendicular[1]
						}
					})
				}
				break
			}
			case ShapeType.Line: {
				const pointDistance = this.#canvas_width / arr.length
				for (let curPoint = 0; curPoint < arr.length; curPoint++) {
					anchors.push({
						leftAnchor: {
							x: pointDistance * curPoint - pointDistance / 3,
							y: arr[curPoint].y
						},
						rightAnchor: {
							x: pointDistance * curPoint + pointDistance / 3,
							y: arr[curPoint].y
						}
					})
				}
			}
		}

		return anchors
	}

	#catmull_rom_smooth(arr: { x: number; y: number }[], k: number) {
		if (k == null) k = 1
		const last = arr.length - 2
		let path = ""

		for (let i = 0; i < arr.length - 1; i++) {
			const x0 = i ? arr[i - 1].x : arr[0].x
			const y0 = i ? arr[i - 1].y : arr[0].y

			const x1 = arr[i].x
			const y1 = arr[i].y

			const x2 = arr[i + 1].x
			const y2 = arr[i + 1].y

			let subx = y2
			let suby = y2
			//Makes the last line before Z a bit less jarring
			if (this.#shape.shape_type == ShapeType.Circle) {
				subx = arr[0].x
				suby = arr[0].y
			}
			const x3 = i !== last ? arr[i + 2].x : subx
			const y3 = i !== last ? arr[i + 2].y : suby

			const cp1x = x1 + ((x2 - x0) / 6) * k
			const cp1y = y1 + ((y2 - y0) / 6) * k

			const cp2x = x2 - ((x3 - x1) / 6) * k
			const cp2y = y2 - ((y3 - y1) / 6) * k

			path += "C" + [cp1x.toFixed(2), cp1y.toFixed(2), cp2x.toFixed(2), cp2y.toFixed(2), x2.toFixed(2), y2.toFixed(2)]
		}
		return path
	}

	#mutate_points() {
		const mutated_points = []
		const frequency_data = this.#get_cured_frequency_data()
		const out_range = [0, this.#canvas_height]
		const in_range = [-165, -30]
		switch (this.#shape.shape_type) {
			case ShapeType.Line: {
				for (let i = 0; i < frequency_data.length - 1; i++) {
					const mutator = isFinite(frequency_data[i])
						? this.#convert_range(frequency_data[i] * this.#fft_multiplier + this.#fft_offset, in_range, out_range)
						: -1 * this.#canvas_height
					mutated_points.push({
						x: this.#shape.points[i].x /** ((Math.max(FFTDataArray[i] + 100)) * 4)*/,
						y: this.#shape.points[i].y - mutator
					})
				}
				break
			}
			case ShapeType.Circle: {
				for (let i = 0; i < frequency_data.length - 1; i++) {
					const new_i = i > (frequency_data.length - 1) / 2 ? frequency_data.length - 1 - i : i
					mutated_points.push({
						x:
							this.#shape.points[i].x * Math.max((frequency_data[new_i] * this.#fft_multiplier + this.#fft_offset) / 50, 1) +
							this.#canvas_width / 2,
						y:
							this.#shape.points[i].y * Math.max((frequency_data[new_i] * this.#fft_multiplier + this.#fft_offset) / 50, 1) +
							this.#canvas_height / 2
					})
					/* TODO: IMPLEMENT SCALING TO BEAT
					this.injectingHTMLElement.parentElement.style.transform = `scale(${(100 + Math.max((frequencyData[2] * 2 + 130) / 5, 1)) / 100})`
					*/
				}

				break
			}
			case ShapeType.Waveform: {
				if (this.#shape.waveform_options!.shape_type == WaveformShape.LineLike) {
					if (this.#shape.symmetry) {
						for (let i = 0; i < this.#shape.points.length; i += 2) {
							let mutator = this.#convert_range(frequency_data[i / 2] * this.#fft_multiplier + this.#fft_offset, in_range, out_range)
							if (mutator <= 0) mutator = 2
							if (this.#shape.waveform_options!.orientation == WaveformOrientation.Horizontal) {
								mutated_points.push({
									x: this.#shape.points[i].x,
									y: this.#shape.points[i].y - mutator
								})
								mutated_points.push({
									x: this.#shape.points[i + 1].x,
									y: this.#shape.points[i + 1].y + mutator
								})
							} else {
								mutated_points.push({
									x: this.#shape.points[i].x + mutator,
									y: this.#shape.points[i].y
								})
								mutated_points.push({
									x: this.#shape.points[i + 1].x - mutator,
									y: this.#shape.points[i + 1].y
								})
							}
						}
					} else {
						for (let i = 0; i < frequency_data.length - 1; i++) {
							const mutator = this.#convert_range(frequency_data[i] * this.#fft_multiplier + this.#fft_offset, in_range, out_range)
							if (this.#shape.waveform_options!.orientation == WaveformOrientation.Horizontal) {
								mutated_points.push({
									x: this.#shape.points[i].x,
									y: this.#shape.points[i].y - mutator
								})
							} else {
								mutated_points.push({
									x: this.#shape.points[i].x - mutator,
									y: this.#shape.points[i].y
								})
							}
						}
					}
				}
				break
			}
		}
		return mutated_points
	}

	#convert_range(value: number, r1: number[], r2: number[]) {
		if (!isFinite(value)) return 0
		if (value < r1[0]) return 0
		return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]
	}

	#create_svg_element() {
		let path
		const arr = this.#mutate_points()
		switch (this.#shape.shape_type) {
			case ShapeType.Line: {
				path = `M ${0} ${this.#canvas_height} `
				break
			}
			case ShapeType.Circle: {
				path = `M ${arr[0].x} ${arr[0].y} `
				break
			}
			case ShapeType.Waveform: {
				path = `M ${0} ${this.#canvas_height / 2}`
				break
			}
		}
		switch (this.#shape.smoothing_algorythm) {
			case SmoothingAlgorythm.Linear: {
				switch (this.#shape.shape_type) {
					case ShapeType.Line: {
						for (let i = 0; i < arr.length; i++) {
							path += `L ${arr[i].x.toFixed(2)},${arr[i].y.toFixed(2)} `
						}
						path += `L ${this.#canvas_width} ${this.#canvas_height} `
						break
					}
					case ShapeType.Circle: {
						for (let i = 0; i < arr.length; i++) {
							path += `L ${arr[i].x.toFixed(2)},${arr[i].y.toFixed(2)} `
						}
						break
					}
					case ShapeType.Waveform: {
						for (let i = 0; i < arr.length; i += 2) {
							path += `L ${arr[i].x.toFixed(2)},${arr[i].y.toFixed(2)} `
						}
						for (let i = arr.length - 1; i >= 0; i -= 2) {
							path += `L ${arr[i].x.toFixed(2)},${arr[i].y.toFixed(2)} `
						}
					}
				}
				path += `Z `
				break
			}

			case SmoothingAlgorythm.BezierPerpendicular: {
				const anchors = this.#create_perpendicular_anchors(arr)

				for (let i = 1; i < arr.length; i++) {
					path += `C ${anchors[i - 1].rightAnchor.x.toFixed(2)} ${anchors[i - 1].rightAnchor.y.toFixed(2)} ${anchors[
						i
					].leftAnchor.x.toFixed(2)} ${anchors[i].leftAnchor.y.toFixed(2)} ${arr[i].x.toFixed(2)} ${arr[i].y.toFixed(2)} `
				}
				if (this.#shape.shape_type == ShapeType.Line) {
					//path += `L ${this.canvasWidth} ${this.canvasHeight / 2} `
					path += `L ${this.#canvas_width} ${this.#canvas_height} `
				}
				path += `Z `
				break
			}

			case SmoothingAlgorythm.BezierWeighted: {
				/*THIS IS VERY MUCH BROKEN ATM :(
				for (let i = 2; i < arr.length; i++) {
					const end = [arr.x[i], arr.y[i]] // the current point is the end of this segment of the curve
					path += `C ${startControl[0]} ${startControl[1]} ${endControl[0]} ${endControl[1]} ${end[0]} ${end[1]}`
				}*/
				console.error("BezierWeighted not implemented yet...")
				break
			}
			case SmoothingAlgorythm.CatmullRom: {
				if (this.#shape.shape_type == ShapeType.Waveform && this.#shape.symmetry == true) {
					//adding points so both halfs ends and start at the same center point
					console.log(arr)
					const first_half = [{ x: 0, y: this.#canvas_height / 2 }]
					const second_half = [{ x: 0, y: this.#canvas_height / 2 }]
					for (let i = 0; i < arr.length - 1; i += 2) {
						first_half.push(arr[i])
						second_half.push(arr[i + 1])
					}
					first_half.push({
						x: this.#canvas_width,
						y: this.#canvas_height / 2
					})
					second_half.push({
						x: this.#canvas_width,
						y: this.#canvas_height / 2
					})
					// path += `M ${this.#canvas_width},${this.#canvas_height / 2}`
					second_half.reverse()
					//path += ` L 0 ${this.#canvas_height / 2}`
					path += this.#catmull_rom_smooth(first_half, 1)
					//path += ` L ${this.#canvas_width} ${this.#canvas_height / 2}`
					path += this.#catmull_rom_smooth(second_half, 1)
					//path += `L 0 ${this.#canvas_height / 2}`
				} else {
					path += this.#catmull_rom_smooth(arr, 1)
				}
				path += `Z`
				break
			}
		}
		return `<path width="100%" height="100%" d="${path}"/>`
	}

	on_data(fn: (data: Float32Array) => void) {
		this.#subscriber_fns.push(fn)
	}
	/**
	 * Useful for waveforms or shapes that don't need to redraw every frame
	 */
	draw_once() {
		this.#svg_injecting_element.innerHTML = this.#create_svg_element()
		this.#subscriber_fns.forEach((fn) => fn(this.#fft_data))
	}

	draw() {
		this.#svg_injecting_element.innerHTML = this.#create_svg_element()
		this.#subscriber_fns.forEach((fn) => fn(this.#fft_data))
		requestAnimationFrame(this.draw.bind(this))
	}
}

export class AudioVisualBuilder {
	#analyzer_node
	#svg_injecting_element
	#canvas_height
	#canvas_width
	#buffer_length
	#smoothing_algorythm
	#fft_size
	#fft_multipier
	#fft_offset
	#from_fft_range
	#to_fft_range
	#point_count: number
	constructor(analyzer_node: AnalyserNode, svg_injecting_element: SVGSVGElement) {
		this.#analyzer_node = analyzer_node
		this.#svg_injecting_element = svg_injecting_element
		this.#canvas_width = svg_injecting_element.viewBox.baseVal.width
		this.#canvas_height = svg_injecting_element.viewBox.baseVal.height
		this.#buffer_length = analyzer_node.frequencyBinCount
		this.#smoothing_algorythm = SmoothingAlgorythm.Linear
		this.#fft_size = 2048
		this.#fft_multipier = 1.5
		this.#fft_offset = 150
		this.#from_fft_range = 0
		this.#to_fft_range = 100
		this.#point_count = Math.round((this.#buffer_length / 100) * (this.#from_fft_range - this.#to_fft_range))
	}
	/**
	 * The smoothingTimeConstant property of the AnalyserNode interface is a double value representing the averaging constant with the last analysis frame. It's basically an average between the current buffer and the last buffer the AnalyserNode processed, and results in a much smoother set of value changes over time.
	 * @param fft_time_smoothing_i A double within the range 0 to 1 (0 meaning no time averaging). The default value is 0.8.
	 * @returns this
	 */
	set_fft_time_smoothing(fft_time_smoothing_i: number) {
		this.#analyzer_node.smoothingTimeConstant = fft_time_smoothing_i
		return this
	}
	/**
	 * The fftSize property of the AnalyserNode interface is an unsigned long value and represents the window size in samples that is used when performing a Fast Fourier Transform (FFT) to get frequency domain data.
	 *
	 *  If the point count set for the analyzer is less than the fft_from > FFT_DATA > fft_to, points might go missing or something will break. In that case increase, otherwise keep to as low as possible due to performance reasons
	 * @param fft_size Must be a power of 2 between 2^5 and 2^15, so one of: `32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, and 32768.` Defaults to `2048`.
	 * @returns this
	 */
	set_fft_size(fft_size: number) {
		if (!(this.#fft_size && !(this.#fft_size & (this.#fft_size - 1)))) throw Error("fft_size not power of two")
		this.#analyzer_node.fftSize = this.#fft_size = fft_size
		this.#buffer_length = this.#analyzer_node.frequencyBinCount
		return this
	}
	/**
	 * Changes how the FFT data is parsed.
	 * Limits the range like:
	 *
	 * `from_fft_range < FFT_DATA < to_fft_range`,
	 *
	 * then splits the remaining data evently between point_count.
	 * `fft_multiplier` and `fft_offset` define how the data then affects the point mutation. FFT data goes from `-Infinity` to `0` (Noise floor usually around `-160`db from experience) Multiplying the number exaggerates the higher decibel changes, making the result more dynamic, whilst the offset keeps the visualizer from clipping.
	 *
	 * Reccomended values are around:
	 *
	 * `shape_type == line`
	 *
	 *  - multiplier: 3
	 *
	 *  - offset: -30
	 *
	 * `shape_type == circle`
	 *
	 *  - multiplier: 1.5
	 *
	 *  - offset: 150
	 * @param param0
	 * @returns
	 */
	set_fft_data_tresholds({
		from_fft_range_i = 0,
		to_fft_range_i = 100,
		point_count_i = Math.round((this.#buffer_length / 100) * (from_fft_range_i - to_fft_range_i)),
		fft_multiplier_i = 2,
		fft_offset_i = -50
	}) {
		this.#from_fft_range = from_fft_range_i
		this.#to_fft_range = to_fft_range_i
		this.#point_count = point_count_i
		this.#fft_multipier = fft_multiplier_i
		this.#fft_offset = fft_offset_i
		return this
	}
	/**
	 * Defines what the svg d attribute path command will use.
	 *
	 * `Linear` - Uses no interpolation between points, jagged but very fast
	 *
	 * `BezierPerpendicular` - Sets the Cubic Bézier anchors perpendicular to the point. Great for Line shapes with no curves.
	 *
	 * `CatmullRom` - Uses Centripetal Catmull–Rom spline under the hood, then translates them to Cubic Bézier points. Best quality, worst performance.
	 *
	 * `BezierWeighted` - DO NOT USE! It's broken at the moment :/. Sets the Cubic Bézier anchors halfway between the next and previous point. Better than Linear on Circular shapes and doesn't have the "invards bulding" side effect of Catmull Rom

	 * @param algorythm Linear = 0; BezierPerpendicular = 1; CatmullRom = 2; BezierWeighted = 3;
	 * @returns
	 */
	set_smoothing_algorythm(algorythm: SmoothingAlgorythm) {
		this.#smoothing_algorythm = algorythm
		return this
	}
	/**
	 * Creates the Audio Visualizer. To start drawing, use .draw(). To further modify it's looks use CSS, eg:
	 * ```css
	 * svg {
	 *   fill: grey;
	 *   stroke: black;
	 *   transform: rotate(90deg);
	 * }
	 * ```
	 * @param shape_type Circle = 0; Line = 1;
	 * @returns `new AudioVisual`
	 */
	build(shape_type: ShapeType, symmetry: boolean, waveform_options?: WaveformOptions) {
		const shape = this.#create_shape(shape_type, symmetry, waveform_options)
		return new AudioVisual(
			this.#analyzer_node,
			this.#svg_injecting_element,
			shape,
			this.#buffer_length,
			this.#fft_multipier,
			this.#fft_offset,
			this.#from_fft_range,
			this.#to_fft_range,
			this.#point_count
		)
	}
	#create_shape(shape_type: ShapeType, symmetry: boolean, waveform_options?: WaveformOptions): Shape {
		const point_amount = this.#get_cured_frequency_data().length
		let new_shape: Shape
		switch (shape_type) {
			case ShapeType.Line: {
				const points = []
				for (let i = 0; i < point_amount; i++) {
					points.push({
						x: (this.#canvas_width / point_amount) * i,
						y: 0
					})
				}
				new_shape = {
					shape_type,
					points,
					smoothing_algorythm: this.#smoothing_algorythm
				}
				break
			}
			case ShapeType.Circle: {
				const points = []
				const radius = this.#canvas_height > this.#canvas_width ? this.#canvas_height / 5 : this.#canvas_width / 5
				for (let i = 0; i < point_amount; i++) {
					points.push({
						x: Math.cos(((2 * Math.PI) / point_amount) * i - Math.PI / 2) * radius,
						y: Math.sin(((2 * Math.PI) / point_amount) * i - Math.PI / 2) * radius
					})
				}

				new_shape = {
					shape_type,
					points,
					smoothing_algorythm: this.#smoothing_algorythm
				}
				break
			}
			case ShapeType.Waveform: {
				if (waveform_options === undefined) {
					console.error("Waveform options undefined at shapetype.waveform, please define!")
					throw Error("Waveform options undefined at shapetype.waveform, please define!")
				}
				const fft_length = this.#get_cured_frequency_data(waveform_options.fft_data).length
				const points = []
				for (let i = 0; i < fft_length; i++) {
					let x, y
					if (waveform_options.shape_type == WaveformShape.LineLike) {
						x = (this.#canvas_width / point_amount) * i
						y = this.#canvas_height / 2
					} else {
						throw Error("WaveformShape.Striped not implemented yet")
					}
					waveform_options.orientation == WaveformOrientation.Horizontal ? points.push({ x: x, y: y }) : points.push({ x: y, y: x })
					//Douple the points needed for symmetry
					if (symmetry) {
						waveform_options.orientation == WaveformOrientation.Horizontal ? points.push({ x: x, y: y }) : points.push({ x: y, y: x })
					}
				}
				new_shape = {
					shape_type,
					points,
					smoothing_algorythm: this.#smoothing_algorythm,
					symmetry: symmetry,
					waveform_options: waveform_options
				}
			}
		}
		return new_shape
	}

	#get_cured_frequency_data(fft_data?: Float32Array) {
		if (!fft_data) {
			fft_data = new Float32Array(this.#buffer_length)
			this.#analyzer_node.getFloatFrequencyData(fft_data)
		}
		const from = Math.round((this.#point_count / 100) * this.#from_fft_range)
		const to = Math.round(this.#buffer_length - (this.#buffer_length / 100) * this.#to_fft_range)
		const squeezeFactor = Math.round((this.#buffer_length - to) / this.#point_count)

		const return_array = new Array(this.#point_count)
		for (let i = 0; i < this.#point_count; i++) {
			return_array[i] = fft_data[from + i * squeezeFactor]
		}
		return return_array
	}
}
