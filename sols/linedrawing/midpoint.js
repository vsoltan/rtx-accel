const panelSize = 600;
const Line = 1, Circle = 2;
const pixelSize = 60;
const width = panelSize/pixelSize>>0;
const height = panelSize/pixelSize>>0;
let drawType = Line;
let ctx = null;	// canvas 2d context for curve panel

let x1=0, y1=0, x2=width-1, y2=height-1;
let r=height-1;
function id(s) {return document.getElementById(s);}

// draw a line from (x1,y1) to (x2,y2), using rgb color
function drawLine(x1, y1, x2, y2, rgb) {
	ctx.strokeStyle = rgb;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

// fill a rectangle starting at (x,y), size (w,h), using rgb color
function drawRectangle(x, y, w, h, rgb) {
	ctx.fillStyle = rgb;
	ctx.fillRect(x, y, w, h);
}

// draw a circle centered at (x,y) with radius r, using rgb color
function drawCircle(x, y, r, rgb) {
	ctx.strokeStyle = rgb;
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2*Math.PI);
	ctx.stroke();
}

function drawPoint(x, y) {
	drawRectangle(x*pixelSize, (height-1-y)*pixelSize, pixelSize, pixelSize, 'rgb(0,255,0)');
}

function midpointLine() {
	let A=y1-y2, B=x2-x1;
	let x=x1, y=y1;
	let d=2*A+B;
	let incNE = 2*(A+B), incE = 2*A;
	drawPoint(x, y);
	while(x<x2) {
		x++;
		if(d<=0) {
			y++;
			d+=incNE;
		} else {
			d+=incE;
		}
		drawPoint(x, y);
	}
}

function updateDrawing() {
	ctx.clearRect(0, 0, panelSize, panelSize);	// clear curve drawing window
	switch(drawType) {
		case Line:
			midpointLine();
			//drawLine((x1+0.5)*pixelSize, panelSize-1-(y1+0.5)*pixelSize, (x2+0.5)*pixelSize, panelSize-1-(y2+0.5)*pixelSize, 'rgb(255,0,0)')
			break;
		case Circle:
			midpointCircle();
			break;
	}
}

function midpointCircle() {
	let x=0, y=r;
	let d = 1.25-r;
	drawPoint(x, y);
	while(x<=y) {
		x++;
		if(d<=0) {
			d+=2*x+3;
		} else {
			d+=2*(x-y)+5;
			y--;
		}
		drawPoint(x, y);
		drawPoint(y, x);
	}
}

function onKeyDown(event) { // Key Press callback function
	//if(event.key>='0' && event.key<='9') { 	}
	switch(event.keyCode) {
		case 37: // left arrow
			if(x2>y2) x2--;
			break;
		case 39: // right arrow
			if(x2<width-1) x2++;
			break;
		case 38: // up arrow
			if(x2>y2) y2++;
			if(r<height-1) r++;
			break;
		case 40: // down arrow
			if(y2>0) y2--;
			if(r>0) r--;
			break;
	}
	updateDrawing();
}

window.onload = function(e) {
	// get canvas2d context
	ctx = id('drawing').getContext('2d');
	updateDrawing();
}

window.addEventListener('keydown',  onKeyDown,  false);



