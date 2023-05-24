export enum SmoothingAlgorythm {
    Linear,
    BezierPerpendicular,
    CatmullRom,
    BezierWeighted,
}
export enum ShapeType {
    Circle,
    Line,
    /*To be Implmeneted
    Waveform,
    FullSongWaveForm
    */
}
type Point = {
    x: number,
    y: number,
}
type Shape = {
    shape_type: ShapeType,
    //Algo-rythm, because this is about music. Get it? xd
    smoothing_algorythm: SmoothingAlgorythm
    points: Point[]
}

export function AudioVisual(
    analyzer_node: AnalyserNode,
    svg_injecting_element: SVGSVGElement,
    shape: Shape,
    buffer_length: number,
    fft_multiplier: number,
    fft_offset: number,
    from_fft_range: number,
    to_fft_range: number,
    point_count: number,
    canvas_height: number,
    canvas_width: number,
) {
    let fft_data = new Float32Array(buffer_length)

    function get_cured_frequency_data() {
        fft_data = new Float32Array(buffer_length)
        analyzer_node.getFloatFrequencyData(fft_data)
        const from = Math.round((point_count / 100) * from_fft_range)
        const to = Math.round(buffer_length - (buffer_length / 100) * to_fft_range)
        const squeeze_factor = Math.round((buffer_length - to) / point_count)

        const return_array = new Array(point_count)
        for (let i = 0; i < point_count + 1; i++) {
            return_array[i] = fft_data[from + i * squeeze_factor]
        }
        return return_array
    }

    function normalise_perpendicular_anchors(x: number, y: number) {
        const magnitude = Math.sqrt(x * x + y * y)
        return [x / magnitude, y / magnitude]
    }

    function create_perpendicular_anchors(arr: { x: number, y: number }[]) {
        const anchors = []
        switch (shape.shape_type) {
            case ShapeType.Circle: {
                const pointDistance = 7
                for (let curPoint = 0; curPoint < arr.length; curPoint++) {
                    const [dx, dy] = normalise_perpendicular_anchors(arr[curPoint].x, arr[curPoint].y)
                    const perpendicular = [-dy, dx]
                    anchors.push({
                        leftAnchor: {
                            x: arr[curPoint].x + pointDistance * perpendicular[0],
                            y: arr[curPoint].y + pointDistance * perpendicular[1],
                        },
                        rightAnchor: {
                            x: arr[curPoint].x - pointDistance * perpendicular[0],
                            y: arr[curPoint].y - pointDistance * perpendicular[1],
                        },
                    })
                }
                break
            }
            case ShapeType.Line: {
                const pointDistance = canvas_width / arr.length
                for (let curPoint = 0; curPoint < arr.length; curPoint++) {
                    anchors.push({
                        leftAnchor: {
                            x: pointDistance * curPoint - pointDistance / 3,
                            y: arr[curPoint].y,
                        },
                        rightAnchor: {
                            x: pointDistance * curPoint + pointDistance / 3,
                            y: arr[curPoint].y,
                        },
                    })
                }
            }
        }

        return anchors
    }

    function catmull_rom_smooth(arr: { x: number, y: number }[], k: number) {
        if (k == null) k = 1
        const last = arr.length - 2

        let path = "M" + [arr[0].x, arr[0].y]

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
            if (shape.shape_type == ShapeType.Circle) {
                subx = arr[0].x
                suby = arr[0].y
            }
            const x3 = i !== last ? arr[i + 2].x : subx
            const y3 = i !== last ? arr[i + 2].y : suby

            const cp1x = x1 + (x2 - x0) / 6 * k
            const cp1y = y1 + (y2 - y0) / 6 * k

            const cp2x = x2 - (x3 - x1) / 6 * k
            const cp2y = y2 - (y3 - y1) / 6 * k

            path += "C" + [cp1x, cp1y, cp2x, cp2y, x2, y2]
        }
        path += " Z"
        return path
    }

    function mutate_points() {
        const mutated_points = []
        const frequency_data = get_cured_frequency_data()
        const out_range = [0, canvas_height]
        const in_range = [-165, -30]
        switch (shape.shape_type) {
            case ShapeType.Line: {
                for (let i = 0; i < frequency_data.length - 1; i++) {
                    mutated_points.push({
                        x: shape.points[i].x /** ((Math.max(FFTDataArray[i] + 100)) * 4)*/,
                        y: shape.points[i].y - convert_range(frequency_data[i] * fft_multiplier + fft_offset, in_range, out_range),
                    })
                }
                break
            }
            case ShapeType.Circle: {
                for (let i = 0; i < frequency_data.length - 1; i++) {
                    const new_i = i > (frequency_data.length - 1) / 2 ? frequency_data.length - 1 - i : i
                    mutated_points.push({
                        x: shape.points[i].x * Math.max((frequency_data[new_i] * fft_multiplier + fft_offset) / 50, 1) + canvas_width / 2,
                        y: shape.points[i].y * Math.max((frequency_data[new_i] * fft_multiplier + fft_offset) / 50, 1) + canvas_height / 2,
                    })
                    /* TODO: IMPLEMENT SCALING TO BEAT
                    this.injectingHTMLElement.parentElement.style.transform = `scale(${(100 + Math.max((frequencyData[2] * 2 + 130) / 5, 1)) / 100})`
                    */
                }

                break
            }
        }
        return mutated_points
    }

    function convert_range(value: number, r1: number[], r2: number[]) {
        if (!isFinite(value)) return 0
        return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0]
    }

    function create_svg_element() {
        let path
        const arr = mutate_points()
        switch (shape.shape_type) {
            case ShapeType.Line: {
                path = `M ${0} ${canvas_height} `
                break
            }
            case ShapeType.Circle: {
                path = `M ${arr[0].x} ${arr[0].y} `
            }
        }
        switch (shape.smoothing_algorythm) {
            case SmoothingAlgorythm.Linear: {
                for (let i = 0; i < arr.length; i++) {
                    path += `L ${arr[i].x},${arr[i].y} `
                }
                if (shape.shape_type == ShapeType.Line) {
                    path += `L ${this.canvasWidth} ${this.canvasHeight / 2} `
                    //path += `L ${canvas_width} ${canvas_height} `
                }
                path += `Z `
                break
            }

            case SmoothingAlgorythm.BezierPerpendicular: {
                const anchors = create_perpendicular_anchors(arr)

                for (let i = 1; i < arr.length; i++) {
                    path += `C ${anchors[i - 1].rightAnchor.x} ${anchors[i - 1].rightAnchor.y} ${anchors[i].leftAnchor.x} ${anchors[i].leftAnchor.y} ${arr[i].x} ${arr[i].y} `
                }
                if (shape.shape_type == ShapeType.Line) {
                    //path += `L ${this.canvasWidth} ${this.canvasHeight / 2} `
                    path += `L ${canvas_width} ${canvas_height} `
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
                path = catmull_rom_smooth(arr, 1)
                break
            }
        }
        return `<path width="100%" height="100%" d="${path}"/>`
    }

    function draw() {
        analyzer_node.getFloatFrequencyData(fft_data)
        svg_injecting_element.innerHTML = create_svg_element()
        requestAnimationFrame(draw.bind(AudioVisual))
    }

    return {
        draw,
    }
}
export function AudioVisualBuilder(analyzer_node: AnalyserNode, svg_injecting_element: SVGSVGElement) {
    let canvas_height: number
    let canvas_width: number
    let buffer_length = analyzer_node.frequencyBinCount
    let smoothing_algorythm = SmoothingAlgorythm.Linear
    let fft_time_smoothing = 0.1
    let fft_size = 4096
    let fft_multipier = 1.5
    let fft_offset = -50
    let from_fft_range = 0
    let to_fft_range = 100
    let point_count: number
    let scale_to_beat = false
    let shape: Shape

    function start() {
        canvas_width = svg_injecting_element.viewBox.baseVal.width // viewbox does exist on svg element, ignore error...
        canvas_height = svg_injecting_element.viewBox.baseVal.height
        return this
    }

    function set_fft_time_smoothing(fft_time_smoothing_i: number) {
        analyzer_node.smoothingTimeConstant = fft_time_smoothing = fft_time_smoothing_i
        return this
    }
    function set_fft_size(fft_size_i: number) {
        if (!(fft_size && !(fft_size_i & (fft_size_i - 1)))) throw Error("fft_size not power of two")
        analyzer_node.fftSize = fft_size = fft_size_i
        buffer_length = analyzer_node.frequencyBinCount
        return this
    }
    function set_fft_data_tresholds({ from_fft_range_i = 0, to_fft_range_i = 100, point_count_i = Math.round((buffer_length / 100) * (from_fft_range_i - to_fft_range_i)), fft_multiplier_i = 2, fft_offset_i = -50 }) {
        from_fft_range = from_fft_range_i
        to_fft_range = to_fft_range_i
        point_count = point_count_i
        fft_multipier = fft_multiplier_i
        fft_offset = fft_offset_i
        return this
    }
    function set_smoothing_algorythm(algorythm: SmoothingAlgorythm) {
        smoothing_algorythm = algorythm
        return this
    }
    function enable_scaling_to_beat(enable = false) {
        scale_to_beat = enable
    }
    function create_shape(shape_type: ShapeType): Shape {
        const point_amount = get_cured_frequency_data(analyzer_node, buffer_length, from_fft_range, to_fft_range, point_count).length
        let new_shape: Shape
        switch (shape_type) {
            case ShapeType.Line: {
                const points = []
                for (let i = 0; i < point_amount; i++) {
                    points.push({
                        x: (canvas_width / point_amount) * i,
                        y: canvas_height / 2 - (0 / point_amount) * i,
                    })
                }
                new_shape = { shape_type, points, smoothing_algorythm }
                break
            }
            case ShapeType.Circle: {
                const points = []
                const radius = canvas_height > canvas_width ? canvas_height / 5 : canvas_width / 5
                for (let i = 0; i < point_amount; i++) {
                    points.push({
                        x: Math.cos(((2 * Math.PI) / point_amount) * i - Math.PI / 2) * radius,
                        y: Math.sin(((2 * Math.PI) / point_amount) * i - Math.PI / 2) * radius,
                    })
                }

                new_shape = { shape_type, points, smoothing_algorythm }
                break
            }
        }
        shape = new_shape
        return this
    }
    function get_cured_frequency_data(analyzer_node: AnalyserNode, buffer_length: number, from_range: number, to_range: number, point_count: number) {
        const fft_data_array = new Float32Array(buffer_length)
        analyzer_node.getFloatFrequencyData(fft_data_array)
        const from = Math.round((point_count / 100) * from_range)
        const to = Math.round(buffer_length - (buffer_length / 100) * to_range)
        const squeezeFactor = Math.round((buffer_length - to) / point_count)

        const return_array = new Array(point_count)
        for (let i = 0; i < point_count; i++) {
            return_array[i] = fft_data_array[from + i * squeezeFactor]
        }
        return return_array
    }
    function build(shape_type: ShapeType) {
        create_shape(shape_type)
        return AudioVisual(analyzer_node, svg_injecting_element, shape, buffer_length, fft_multipier, fft_offset, from_fft_range, to_fft_range, point_count, canvas_height, canvas_width)
    }
    return {
        start,
        set_fft_size,
        enable_scaling_to_beat,
        set_fft_time_smoothing,
        set_fft_data_tresholds,
        set_smoothing_algorythm,
        build
    }
}
