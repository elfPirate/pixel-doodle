let w;
let h;
let startColor = "rgb(0,0,0,0)";

let image = document.getElementById("image");
const imageBox = document.getElementById("imageBox");
image.innerHTML = '';
image.addEventListener('contextmenu', event => event.preventDefault());
let color1 = "rgb(0,0,0)";
let color2 = "rgb(255,255,255)";

let storage = window.sessionStorage;
const saveButton = document.getElementById("fileExport");
saveButton.addEventListener("click", save);
const importButton = document.getElementById("fileImport");

const localSaveButton = document.getElementById("fileSave");
localSaveButton.addEventListener("click", localSave);
const localImportButton = document.getElementById("fileOpen");
localImportButton.addEventListener("click", localImport);

const colorInputs = document.getElementById("colorinputs");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext('2d');
//const fileNameInput = document.getElementById("filename");

const c1button = document.getElementById("color1");
const c2button = document.getElementById("color2");
c1button.value = rgbToHex(color1);
c2button.value = rgbToHex(color2);
c1button.addEventListener("change", () => { color1 = c1button.value; });
c2button.addEventListener("change", () => { color2 = c2button.value; });

function canvasDraw(x, y, color){
	ctx.fillStyle = color;
	ctx.clearRect(x, y, 1, 1);
	ctx.fillRect(x, y, 1, 1);
}

function drawPixel(element, color) {
	element.style.backgroundColor = color;
	canvasDraw(Number(element.dataset.x), Number(element.dataset.y), color);
}

function importPng(file){
	var fr = new FileReader();
	fr.onload = () => {
		let img = new Image();
		img.onload = () => {
			rebuildImage(img.width, img.height);
				ctx.drawImage(img, 0, 0);
				updateImage();
		};
		img.src = fr.result;
	};
	fr.readAsDataURL(file);
}

let referenceImage = [];
importButton.addEventListener("click", function() {
	let file = document.createElement("input");
	file.type = "file";
	file.addEventListener("change", () => {

		importPng(file.files[0]);
	});
	file.dispatchEvent(new Event("click"));

});

function save() {

	var MIME_TYPE = "image/png";

	var imgURL = canvas.toDataURL(MIME_TYPE);
	let namePrompt = prompt("Export as:", "Untitled");
	if (!namePrompt) return;
	var dlLink = document.createElement('a');

	dlLink.download = namePrompt;
	if(namePrompt === "") {
		dlLink.download = "Untitled";
	}
	dlLink.href = imgURL;
	dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

	document.body.appendChild(dlLink);
	dlLink.click();
	document.body.removeChild(dlLink);
}

function localSave(){
	let saveString = generateSaveString(image);
	storage.setItem((prompt("Localsave id:", 0)), saveString);
	window.alert("Saved!");
}

function localImport(){
	const openObject = JSON.parse(storage.getItem((prompt("Localsave id:", 0))));
	loadImageFromObject(openObject);
}


function pixelSetter(target, newColor) {
	const oldColor = target.style.backgroundColor;
	return {
		do: () => drawPixel(target, newColor),
		undo: () => drawPixel(target, oldColor),
	};
}

function createGroupAction(items) {
	return {
		items: items,
		do: () => {
			for (let i = 0; i < items.length; i ++)
				items[i].do();
		},
		undo: () => {
			for (let i = items.length - 1; i >= 0; --i)
				items[i].undo();
		},
	}
}

let currentGroup;
let undoActions = [];
let redoActions = [];

function undoAction(target, before, after, type) {
	this.target = target;
	this.before = before;
	this.after = after;
	this.type = type;
}

document.addEventListener("keyup", handleKey);

function undo(){
	const action = undoActions.pop();
	if (action) {
		redoActions.push(action);
		action.undo();
	}
}

function redo(){
	const action = redoActions.pop();
	if (action) {
		undoActions.push(action);
		action.do();
	}
}

function pencilClick(event, buttonsPressed) {

	if (buttonsPressed & (1 << 0)) {
		return pixelSetter(event.currentTarget, color1);
	}
	else if (buttonsPressed & (1 << 1)) {
		return pixelSetter(event.currentTarget, color2);
	}
}

function eraserClick(event, buttonsPressed) {
	if (buttonsPressed & (1 << 0)) {
		return pixelSetter(event.currentTarget, "rgb(0,0,0,0)");
	}
}

function eyedropperClick(event, buttonsPressed) {
	let colortarget = event.currentTarget.style.backgroundColor;
	if (buttonsPressed & (1 << 0)) {
		//color1 = colortarget;
		color1 = c1button.value = rgbToHex(colortarget);
	}
	else if (buttonsPressed & (1 << 1)) {
		//color2 = colortarget;
		color2 = c2button.value = rgbToHex(colortarget);
	}

}

let recentTool = "";
function selectedTool (tool) {
	if (recentTool) {
		document.body.classList.remove(recentTool);
	}
		document.body.classList.add(tool);
	recentTool = tool;
}

let currentTool = pencilClick;
const penciltool = document.getElementById("pencil");
const erasertool = document.getElementById("eraser");
const eyedroppertool = document.getElementById("eyedropper");
penciltool.addEventListener("click", () => {
	currentTool = pencilClick;
	selectedTool(penciltool.id);
});
erasertool.addEventListener("click", () => { 
	currentTool = eraserClick; 
	selectedTool(erasertool.id);
});
eyedroppertool.addEventListener("click", () => { 
	currentTool = eyedropperClick; 
	selectedTool(eyedroppertool.id);
});

function handleKey(event){
	if (event.keyCode == 90 && event.ctrlKey) undo();
	if (event.keyCode == 89 && event.ctrlKey) redo();
	if (event.keyCode == 68) {currentTool = pencilClick; selectedTool(penciltool.id);}
	if (event.keyCode == 69) {currentTool = eraserClick; selectedTool(erasertool.id);}
	if (event.keyCode == 70) {currentTool = eyedropperClick; selectedTool(eyedroppertool.id);}
	if (event.keyCode == 69 && event.ctrlKey) save();
}

let mouseIsDown;
function onMouseDown(event) {
	event.preventDefault();
	let group = createGroupAction([]);
	currentGroup = group;
	undoActions.push(group);
	handleCLick(event);
	mouseIsDown = true;
}

function onMouseUp(event) {
	mouseIsDown = false;
	currentGroup = null;
}

document.body.addEventListener("mouseup", onMouseUp);
document.body.addEventListener("mouseleave", onMouseUp);
function onMouseEnter(event) {
	if (mouseIsDown) {
		handleCLick(event);
	}
}

function handleCLick(event) {
	let buttonsPressed = event.buttons;
	redoActions = [];
	
	const toolAction = currentTool(event, buttonsPressed);
	toolAction.do();
	(currentGroup ? currentGroup.items : undoActions).push(toolAction);
}

function paletteClick (event) {
	let buttonsPressed = event.buttons;
	event.preventDefault();
	let colortarget = event.currentTarget.style.backgroundColor;
	if (buttonsPressed & (1 << 0)) {
		color1 = colortarget;
		color1 = c1button.value = rgbToHex(colortarget);
	}
	else if (buttonsPressed & (1 << 1)) {
		color2 = colortarget;
		color2 = c2button.value = rgbToHex(colortarget);
	}
}

let importPaletteButton = document.getElementById("importPaletteButton");
importPaletteButton.addEventListener("click", readHexPalette);

let palette = ["black", "white"];
for (let i = 0; i < 360; i += 360 / 32) {
	palette.push(`hsl(${i.toFixed(1)},100%,50%)`);
}

let input = document.getElementById("importpalette");
function readHexPalette (){
	let hex = input.value.split(" ");

	palette = [];
	for (let i = 0; i < hex.length-1; i++) {
		hex[i] = "#" + hex[i];
		palette.push(rgbToHex(hex[i]));
	}
	reloadPalette(palette);

}

function reloadPalette (palette){
	let palettes = document.getElementById("palettes");
	palettes.remove();
	palettes = document.createElement("div");
	palettes.id = "palettes";
	colorInputs.appendChild(palettes);
	for (let i = 0; i <= palette.length-1; i ++) {
		
		let paletteColor = document.createElement("div");
		paletteColor.className = "paletteColor";
		paletteColor.draggable = false;
		paletteColor.style.backgroundColor = palette[i];
		console.log(paletteColor.style.backgroundColor);
		paletteColor.addEventListener("mousedown", paletteClick);
		palettes.appendChild(paletteColor);
	}
}

for (let i = 0; i < h; i++) {
	let row = [];
	for (let j = 0; j < w; j++) {
		row.push(startColor);	
	}
	referenceImage.push(row);
}

function loadImageFromObject(img) {
	rebuildImage(img.width, img.height, img.pixels);
}

function rebuildImage(width, height, reference){
	if(width === w && height === h) {return;}
	w = width;
	h = height;
	canvas.width = w;
	canvas.height = h;
	image.remove();
	image = document.createElement("div");
	image.id = "image";
	imageBox.appendChild(image);
	for (let i = 0; i < h; i++) {
		let htmlrow = document.createElement("div");
		htmlrow.className = "row";
		htmlrow.draggable = false;
		for (let j = 0; j < w; j++) {
			let htmlcell = document.createElement("div");
			htmlcell.className = "cell";
			let bgColor = document.createElement("div");
			bgColor.draggable = false;
			bgColor.classList = "bg";
			bgColor.dataset.x = j;
			bgColor.dataset.y = i;
			bgColor.addEventListener("mousedown", onMouseDown);
			bgColor.addEventListener("mouseenter", onMouseEnter);
			bgColor.addEventListener('contextmenu', event => event.preventDefault());
			if (reference) {
				drawPixel(bgColor, reference[i][j]);
			}
			htmlcell.appendChild(bgColor);
			htmlrow.appendChild(htmlcell);
		}
		image.appendChild(htmlrow);
	}
}

rebuildImage(16, 16);
reloadPalette(palette);