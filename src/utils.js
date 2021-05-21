let hack = document.createElement("div");

function parseRGB(color) {
	hack.style.backgroundColor = color;
	const m = /^rgba?\(([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)(?:,\s*([0-9.]+))?\)/.exec(hack.style.backgroundColor);
	if (!m) {
		console.error(m);
		return;
	}
	let result = [
		Number(m[1]),
		Number(m[2]),
		Number(m[3]),
	];
	if (m[4]) {
		//result.push(m[4]);
	}
	return result;
}
const rgbToHex = (rgb) => '#' + parseRGB(rgb).map(rgb => rgb.toString(16).padStart(2, '0')).join('');

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	console.log(result);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function generateSaveString (image) {
	let pixels = [];
	for (let row of image.querySelectorAll("div.row")) {
		let rows = [];
		for (let cell of row.querySelectorAll("div.bg")) {
			rows.push(cell.style.backgroundColor);
		}
		pixels.push(rows);
	}
	console.log(pixels);
	let img = {
		width: w,
		heignt: h,
		pixels: pixels
	}
	return JSON.stringify(img);
}

function updateCanvas () {
	let rows = image.querySelectorAll("div.row");
	for (let i = 0; i < rows.length; i ++) {
		let row = rows[i];
		let cells = row.querySelectorAll("div.bg");
		for (let j = 0; j < cells.length; j ++) {
			let cell = cells[j];
			canvasDraw(j, j, cell.style.backgroundColor);
		}
		pixels.push(rows);
	}
}

function updateImage () {
let imgData = ctx.getImageData(0, 0, w, h);
	let rows = image.querySelectorAll("div.row");
	for (let y = 0; y < rows.length; y ++) {
		let row = rows[y];
		let cells = row.querySelectorAll("div.bg");
		for (let x = 0; x < cells.length; x ++) {
			let cell = cells[x];
			let i = 4*(y*imgData.width + x);
			cell.style.backgroundColor = "rgb(" + imgData.data[i] + ", " + imgData.data[i+1] + ", " + imgData.data[i+2] + ", " + imgData.data[i+3] + ")"
		}
	}
}