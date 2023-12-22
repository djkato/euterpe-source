document.getElementById("regenerate").addEventListener("click", async (ev) => {
	result = await analyze()
	download(JSON.stringify(result.db), "db.json", "text/plain")
})

document.getElementById("upload").addEventListener("change", (ev) => {
	/*
	audioContext.resume()
	const fileReader = new FileReader()
	fileReader.readAsText(ev.target.files[0])
	fileReader.onload = event => {
		let str = JSON.parse(event.target.result)
		let new_db = from_json(str)
		//-infinity get stringified to null, undo that
		for (const song of new_db.songs) {
			if (song.fft_data) {
				for (let i = 0; i < song.fft_data.length; i++) {
					if (song.fft_data[i] === null || song.fft_data[i] === undefined) song.fft_data[i] = -Infinity
				}
			}
		}
		result = { db: new_db, analyzer_node: audioContextAnalyser }
	}
	*/
})

function download(content, fileName, contentType) {
	var a = document.querySelector("#download");
	var file = new Blob([content], { type: contentType });
	a.href = URL.createObjectURL(file);
	a.download = fileName;
	// a.click();
}
