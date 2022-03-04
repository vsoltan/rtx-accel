/* CMPSCI 373 Homework 3 -- Curves */

const panelSize = 600;
const Bezier = 1, BSpline = 2, Hermite = 3;
const dotSize = 5;
const fov = 45;
const aspect = 1;
let scene, renderer, camera, material, orbit;

let controlPts = [];	// array that stores control points
let curvePts = [];		// array that stores curve points
let selectedPoint = -1;	// selected control point
let targetPoint = -1;		// selected target point (for defining tangent in Hermite curve)

let curveType = Bezier;	// default curve type is Bezier
let ctxCurve = null;	// canvas 2d context for curve panel
let showControlLines = true;
let showAxis = false;
let closedCurve = false;
let nSegment = 30;	// number of segments for curve computation
let nRotSamples = 50;	// number of rotational samples for surface of revolution
let axis = 0.0;			// rotation axis
let axisStep = 0.01;
let surface = null;	// surface of revolution

// Transformation parameters for surface rendering
let scale = 1.0;
let angleV = 0.0;
let flatShading = false;

//Mouse variables
var mouse = new THREE.Vector2();
var prevMouse = new THREE.Vector2();
let mouseClicked = false;
let mouseButton = -1;

function id(s) {return document.getElementById(s);}
function message(s) {id('msg').innerHTML=s;}

// draw a line from (x1,y1) to (x2,y2), using rgb color
function drawLine(x1, y1, x2, y2, rgb) {
	ctxCurve.strokeStyle = rgb;
	ctxCurve.beginPath();
	ctxCurve.moveTo(x1, y1);
	ctxCurve.lineTo(x2, y2);
	ctxCurve.stroke();
}

// fill a rectangle starting at (x,y), size (w,h), using rgb color
function drawRectangle(x, y, w, h, rgb) {
	ctxCurve.fillStyle = rgb;
	ctxCurve.fillRect(x, y, w, h);
}

// draw a circle centered at (x,y) with radius r, using rgb color
function drawCircle(x, y, r, rgb) {
	ctxCurve.strokeStyle = rgb;
	ctxCurve.beginPath();
	ctxCurve.arc(x, y, r, 0, 2*Math.PI);
	ctxCurve.stroke();
}

// draw control lines, control points, and target points
function drawControlLines() {
	if(!showControlLines) return;
	for(let i=0; i<controlPts.length; i++) {
		let pt = controlPts[i];
		drawRectangle(pt.x-dotSize, pt.y-dotSize, 2*dotSize, 2*dotSize, 'rgb(255,0,0)');
	}
	for(let i=0; i<controlPts.length-1; i++) {
		let pt1 = controlPts[i];
		let pt2 = controlPts[i+1];
		drawLine(pt1.x, pt1.y, pt2.x, pt2.y, 'rgb(32,32,255)');
	}
	if(curveType==Hermite) {
		for(let i=0; i<controlPts.length; i++) {
			let pt = controlPts[i];
			drawCircle(pt.x+pt.dx, pt.y+pt.dy, dotSize, 'rgb(255,160,0)');
			drawLine(pt.x, pt.y, pt.x+pt.dx, pt.y+pt.dy, 'rgb(255,160,0)');
		}		
	}
}

// draw rotation axis
function drawAxis() {
	if(!showAxis) return;
	let x = (axis+0.5)*panelSize>>0;
	drawLine(x, 10, x, panelSize-10, 'rgb(128,0,0)');
}

// draw curve using curvePts array
function drawCurve() {
	for(let i=0;i<curvePts.length-1;i++) {
		let pt1 = curvePts[i];
		let pt2 = curvePts[i+1];
		drawLine(pt1.x, pt1.y, pt2.x, pt2.y, 'rgb(0,255,0)');
	}
}

function computeBezier() {
	if (controlPts.length < 3) { return; } // need at least 3 control points
	
	// use controlPts array and nSegment to compute Bezier curve points
	// and append curve points to curvePts array
	
// ===YOUR CODE STARTS HERE===

	let n = controlPts.length;
	for(let i=0; i <= nSegment; i++){
		let t = i / nSegment; 
		// curvePts[i] = Q(t)
		let x = recursion_x(t, 0, n-1, controlPts[0].x); // use recursive formula to compute this
		let y = recursion_y(t, 0, n-1, controlPts[0].y); // use recursive formula to compute this

		curvePts.push({x, y});

		// for(let j=0; j < controlPts.length; j++){
		// 	pts[i] += (factorial(n-1)/(factorial(j)*factorial(n-1-j)))*Math.pow(t, j)*Math.pow((1-t), n-1-j);
		// }
			// drawLine(pts[i-1], pts[i]);
		if (i!=0) 
			drawLine(curvePts[i-1], curvePts[i]);
	}

// ---YOUR CODE ENDS HERE---

	drawCurve();
}

function recursion_x(t, i, lvl_j){
	if (lvl_j == 0)
		return controlPts[i].x;
	else
		return (1-t)*recursion_x(t, i, lvl_j-1) + t*recursion_x(t, i+1, lvl_j-1);
}

function recursion_y(t, i, lvl_j){
	if (lvl_j == 0)
		return controlPts[i].y;
	else
		return (1-t)*recursion_y(t, i, lvl_j-1) + t*recursion_y(t, i+1, lvl_j-1);
}


function computeBSpline() {
	if (controlPts.length < 3) { return ; } // need at least 3 control points

	// use controlPts array, nSegment to compute BSpline curve points
	// and append curve points to curvePts array
	// must correctly handle open or closed curve depending on value of closedCurve

// ===YOUR CODE STARTS HERE===

	let n = controlPts.length;
	// let M = (1/6)*[[-1, 3, -3, 1], [3, -6, 3, 0], [-3, 0, 3, 0], [1, 4, 1, 0]];

	if(closedCurve) {
		for(let i=0; i < n; i++){			// closed => use '%n' to simulate circular array
			//calculate for x
			let p0_x = controlPts[i%n].x;
			let p1_x = controlPts[(i+1)%n].x;
			let p2_x = controlPts[(i+2)%n].x;
			let p3_x = controlPts[(i+3)%n].x;
			//calculate for y
			let p0_y = controlPts[i%n].y;
			let p1_y = controlPts[(i+1)%n].y;
			let p2_y = controlPts[(i+2)%n].y;
			let p3_y = controlPts[(i+3)%n].y;

			for(let j = 0; j <= nSegment; j++){
				let t = j / nSegment;
				let T = [Math.pow(t, 3), Math.pow(t, 2), t, 1];

				let p_x = [[p0_x], [p1_x], [p2_x], [p3_x]];
				let q_x = (1/6)*(Math.pow(t,3)*(-1*p0_x+3*p1_x-3*p2_x+p3_x) + Math.pow(t,2)*(3*p0_x-6*p1_x+3*p2_x+0) + 
					t*(-3*p0_x+0+3*p2_x+0) + 1*(p0_x+4*p1_x+p2_x+0));

				let p_y = [[p0_y], [p1_y], [p2_y], [p3_y]];
				let q_y = (1/6)*(Math.pow(t,3)*(-1*p0_y+3*p1_y-3*p2_y+p3_y) + Math.pow(t,2)*(3*p0_y-6*p1_y+3*p2_y+0) + 
					t*(-3*p0_y+0+3*p2_y+0) + 1*(p0_y+4*p1_y+p2_y+0));

				//add points (q) to curvePts

				curvePts.push({'x': q_x, 'y': q_y});
			}
		}
	}
	else {
		for(let i=0; i < n-3; i++){			// not closed => run on the defined set of points
			//calculate for x
			let p0_x = controlPts[i].x;
			let p1_x = controlPts[i+1].x;
			let p2_x = controlPts[i+2].x;
			let p3_x = controlPts[i+3].x;
			//calculate for y
			let p0_y = controlPts[i].y;
			let p1_y = controlPts[i+1].y;
			let p2_y = controlPts[i+2].y;
			let p3_y = controlPts[i+3].y;

			for(let j = 0; j <= nSegment; j++){
				let t = j / nSegment;
				let T = [Math.pow(t, 3), Math.pow(t, 2), t, 1];

				let p_x = [[p0_x], [p1_x], [p2_x], [p3_x]];
				let q_x = (1/6)*(Math.pow(t,3)*(-1*p0_x+3*p1_x-3*p2_x+p3_x) + Math.pow(t,2)*(3*p0_x-6*p1_x+3*p2_x+0) + 
					t*(-3*p0_x+0+3*p2_x+0) + 1*(p0_x+4*p1_x+p2_x+0));

				let p_y = [[p0_y], [p1_y], [p2_y], [p3_y]];
				let q_y = (1/6)*(Math.pow(t,3)*(-1*p0_y+3*p1_y-3*p2_y+p3_y) + Math.pow(t,2)*(3*p0_y-6*p1_y+3*p2_y+0) + 
					t*(-3*p0_y+0+3*p2_y+0) + 1*(p0_y+4*p1_y+p2_y+0));

				//add points (q) to curvePts

				curvePts.push({'x': q_x, 'y': q_y});
			}
		}
	}
// ---YOUR CODE ENDS HERE---

	drawCurve();
}

function computeHermite() {
	if(controlPts.length<2) { return; } // need at least 2 points
	for(let i=0;i<controlPts.length;i++) {
		if(typeof(controlPts[i].dx)=='undefined' || typeof(controlPts[i].dy)=='undefined') {
			console.log('no tangent data');	// make sure we have tangent data
			return;
		}
	}
	
	// use controlPts array, nSegment to compute Hermite curve points
	// and append curve points to curvePts array
	// must correctly handle open or closed curve depending on value of closedCurve
		
// ===YOUR CODE STARTS HERE===

	let n = controlPts.length;

	if(closedCurve) {
		for(let i=0; i < n; i++){			// closed => use '%n' to simulate circular array
			//calculate for x
			let p0_x = controlPts[i%n].x;
			let p1_x = controlPts[(i+1)%n].x;
			let p0_dx = controlPts[i%n].dx;
			let p1_dx = controlPts[(i+1)%n].dx;

			//calculate for y
			let p0_y = controlPts[i%n].y;
			let p1_y = controlPts[(i+1)%n].y;
			let p0_dy = controlPts[i%n].dy;
			let p1_dy = controlPts[(i+1)%n].dy;

			for(let j = 0; j <= nSegment; j++){
				let t = j / nSegment;

				let A_x = 2*p0_x-2*p1_x+2*p0_dx+2*p1_dx;
				let B_x = -3*p0_x+3*p1_x-4*p0_dx-2*p1_dx;
				let C_x = 2*p0_dx;
				let D_x = p0_x;

				let q_x = A_x*Math.pow(t, 3) + B_x*Math.pow(t, 2) + C_x*t + D_x;

				let A_y = 2*p0_y-2*p1_y+2*p0_dy+2*p1_dy;
				let B_y = -3*p0_y+3*p1_y-4*p0_dy-2*p1_dy;
				let C_y = 2*p0_dy;
				let D_y = p0_y;

				let q_y = A_y*Math.pow(t, 3) + B_y*Math.pow(t, 2) + C_y*t + D_y;

				//add points (q) to curvePts

				curvePts.push({'x': q_x, 'y': q_y});
			}
		}
	}
	else {
		for(let i=0; i < n-1; i++){			// not closed => run on the defined set of points
			//calculate for x
			let p0_x = controlPts[i].x;
			let p1_x = controlPts[i+1].x;
			let p0_dx = controlPts[i].dx;
			let p1_dx = controlPts[i+1].dx;
			//calculate for y
			let p0_y = controlPts[i].y;
			let p1_y = controlPts[i+1].y;
			let p0_dy = controlPts[i].dy;
			let p1_dy = controlPts[i+1].dy;

			for(let j = 0; j <= nSegment; j++){
				let t = j / nSegment;

				let A_x = 2*p0_x-2*p1_x+2*p0_dx+2*p1_dx;
				let B_x = -3*p0_x+3*p1_x-4*p0_dx-2*p1_dx;
				let C_x = 2*p0_dx;
				let D_x = p0_x;

				let q_x = A_x*Math.pow(t, 3) + B_x*Math.pow(t, 2) + C_x*t + D_x;

				let A_y = 2*p0_y-2*p1_y+2*p0_dy+2*p1_dy;
				let B_y = -3*p0_y+3*p1_y-4*p0_dy-2*p1_dy;
				let C_y = 2*p0_dy;
				let D_y = p0_y;

				let q_y = A_y*Math.pow(t, 3) + B_y*Math.pow(t, 2) + C_y*t + D_y;

				//add points (q) to curvePts

				curvePts.push({'x': q_x, 'y': q_y});
			}
		}
	}

// ---YOUR CODE ENDS HERE---

}

function updateCurve() {
	ctxCurve.clearRect(0, 0, panelSize, panelSize);	// clear curve drawing window
	curvePts = [];	// empty curvePts array
	drawControlLines();
	drawAxis();
	switch(curveType) {
		case Bezier:
			computeBezier();
			break;
		case BSpline:
			computeBSpline();
			break;
		case Hermite:
			computeHermite();
			break;
	}
	drawCurve();
	if(control['Auto Mesh']) { // regenerate surface if Auto Mesh flag is on
		updateSurface();
	}
}

// remove adjacent duplicate curve points as they mess up normal computation
function sanitizeCurvePts() {
	let i=0;
	while(i<curvePts.length-1) {
		let p=curvePts[i];
		let q=curvePts[i+1];
		if(Math.abs(p.x-q.x)<0.001 && Math.abs(p.y-q.y)<0.001) {
			curvePts.splice(i, 1);
		} else i++;
	}
}

function updateSurface() {
	if (surface!=null) {
		scene.remove(surface);	// remove old surface from scene
		surface = null;
	}
	
	sanitizeCurvePts();
	
	let npts = curvePts.length;
	if (npts==0) return;
	
	let mesh = new THREE.Geometry(); // create new mesh object 
	
	let closed = (closedCurve && (curveType==BSpline || curveType==Hermite));
	let angle, vx, vy, vz;

	// If curve is closed, we ignore the last point since
	// it duplicates the first point. This ensures normal
	// is calculated correctly at the joint.
	for (let j=0; j<nRotSamples; j++) {
		for (let i=0; i < (closed ? (npts-1) : npts); i++) {
			angle = Math.PI + 2 * Math.PI * j / nRotSamples;

			let norm_x = curvePts[i].x/panelSize-0.5;
			let norm_y = (1-curvePts[i].y/panelSize)-0.5;
			vx = (axis - norm_x) * Math.cos(angle);
			vy = norm_y;
			vz = -(axis - norm_x) * Math.sin(angle);

			mesh.vertices.push(new THREE.Vector3(vx, vy, vz));
		}
	}

	for (let j=0; j<nRotSamples; j++) {
		if (closed) {
			for (let i=0; i < npts-1; i++) {
				v1 = j*(npts-1) + i;
				v2 = j*(npts-1) + (i+1)%(npts-1);
				v3 = ((j+1)%nRotSamples) * (npts-1) + (i+1)%(npts-1);
				v4 = ((j+1)%nRotSamples) * (npts-1) + i;

				mesh.faces.push(new THREE.Face3(v1, v2, v3));
				mesh.faces.push(new THREE.Face3(v1, v3, v4));
			}
		}
		else {
			for (let i=0; i < npts-1; i++) {
				v1 = j*npts + i;
				v2 = j*npts + i+1;
				v3 = ((j+1)%nRotSamples) * npts + i+1;
				v4 = ((j+1)%nRotSamples) * npts + i;

				mesh.faces.push(new THREE.Face3(v1, v2, v3));
				mesh.faces.push(new THREE.Face3(v1, v3, v4));
			}		
		}
	}

	mesh.computeFaceNormals(); // create mesh normal
	if(!flatShading) mesh.computeVertexNormals(); // create vertex normal
	surface = new THREE.Mesh(mesh, material); // attach material to mesh
	scene.add(surface);	// add surface to scene
	renderSurfaceViewer();
}

function renderSurfaceViewer() {
	if (surface != null) {
		surface.rotation.setFromVector3(new THREE.Vector3(angleV, 0.0, 0.0));
		surface.scale.set(scale, scale, scale);
		camera.updateProjectionMatrix();
		renderer.render(scene, camera);
	}
}

function onKeyDown(event) { // Key Press callback function
	switch(event.key) {
		case 'a':
		case 'A':
			showAxis = !showAxis;
			message(showAxis ? 'show axis' : 'hide axis');
			break;
		case 'w':
		case 'W':
			material.wireframe = !material.wireframe;
			message(material.wireframe ? 'wireframe rendering' : 'solid rendering');
			renderSurfaceViewer();
			break;
		case 'f':
		case 'F':
			flatShading = !flatShading;
			message(flatShading ? 'flat shading' : 'smooth shading');			
			updateSurface();
			break;
		case 'e':
		case 'E':
			controlPts = [];
			curvePts = [];
			message('curve erased');
			break;
		case 'z':
		case 'Z':
			message('draw Bezier');
			curveType = Bezier;
			break;
		case 'b':
		case 'B':
			message('draw BSpline');
			curveType = BSpline;
			break;
		case 'm':
		case 'M':
			curveType = Hermite;
			message('draw Hermite');
			break;			
		case '+':
		case '=':
			if(nSegment<80) {
				nSegment++;
				message('nSegment = '+nSegment);
			}
			break;
		case '-':
		case '_':
			if(nSegment>1) {
				nSegment--;
				message('nSegment = '+nSegment);
			}
			break;
		case 'c':
		case 'C':
			closedCurve = !closedCurve;
			message(closedCurve ? 'closed curve' : 'open curve');
			break;
		case 'l':
		case 'L':
			showControlLines = !showControlLines;
			message(showControlLines ? 'show control lines' : 'hide control lines');
			break;
		case ' ':
		case 's':
		case 'S':
			updateSurface();
			break;
	}
	if(event.key>='0' && event.key<='9') {
		loadPreset(event.key-'0');
	} else if(event.keyCode==37) { // left arrow
		axis-=axisStep;
		if(axis<-0.5) axis=-0.5;
		message('rotation axis = '+axis.toFixed(2));
	} else if(event.keyCode==39) { // right arrow
		axis+=axisStep;
		if(axis>0.5) axis=0.5;
		message('rotation axis = '+axis.toFixed(2));		
	}
	updateCurve();
}

function loadPreset(idx) {
	if(typeof(presets[idx])=='undefined') {
		message('presets['+idx+'] does not exist');
		return;
	}
	let norm_xy = presets[idx];
	// recover resolution dependent cooridnates
	controlPts=[];
	for(let i=0;i<norm_xy.length;i++) {
		controlPts[i]={'x':(norm_xy[i].x+0.5)*panelSize,'y':(0.5-norm_xy[i].y)*panelSize};
		if(typeof(norm_xy[i].dx)!='undefined')
			controlPts[i].dx = norm_xy[i].dx*panelSize;
		if(typeof(norm_xy[i].dy)!='undefined')
			controlPts[i].dy = norm_xy[i].dy*panelSize;
	}
	message('loaded presets['+idx+']');
	updateCurve();
}

let controlParams = function() {
	this['Auto Mesh'] = false;
  this['Save Mesh'] = function() {
  	if(surface==null) return;
	  let exporter = new THREE.OBJExporter();
	  let text = exporter.parse(surface);
	  let blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
	  saveAs(blob, 'mesh.obj');
  };

  this['Save Control Points'] = function() {
  	if(controlPts==null || controlPts.length==0) return;
  	// normalize coordinates to [-0.5, 0.5] so they are resolution-independent
  	let norm_xy = [];
  	for(let i=0;i<controlPts.length;i++) {
  		norm_xy[i] = {'x':(controlPts[i].x/panelSize-0.5),'y':(0.5-controlPts[i].y/panelSize),
  		              'dx':controlPts[i].dx/panelSize, 'dy':controlPts[i].dy/panelSize};
  	}
	  let text = JSON.stringify(norm_xy)+',';
	  let blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
	  saveAs(blob, 'pts.js');
  };
};

let control = new controlParams();

window.onload = function(e) {
	// get canvas2d context
	ctxCurve = id('curve').getContext('2d');

	// creat control GUI
	let gui = new dat.GUI();
	let ctrl;
	
	ctrl = gui.add(control, 'Auto Mesh');
	ctrl.onFinishChange(function(value) {
		updateCurve();
		message(value ? 'Auto mesh update ON' : 'Auto mesh update off');
	});
	
	gui.add(control, 'Save Control Points');
	gui.add(control, 'Save Mesh');	


	// create scene and set up camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000 );
	camera.position.x=0;
	camera.position.y=0;
	camera.position.z=2;
	camera.lookAt(new THREE.Vector3(0,0,0));
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(panelSize, panelSize);
	renderer.shadowMap.enabled = true;
	renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.2));
	id('surface').appendChild(renderer.domElement);
	
	// create lighting
	let frontLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 1.5);
	frontLight.position.set(-10, 10, 10);

	let backLight = new THREE.PointLight(new THREE.Color(1, 1, 1), 0.5);
	backLight.position.set(10, -10, 10);

	scene.add(frontLight);
	scene.add(backLight);
	
	// create material
	material = new THREE.MeshPhongMaterial(
		{color: new THREE.Color(0.8, 0.5, 0.2),
		side: THREE.DoubleSide,
		shininess: 100,
		specular : new THREE.Color(0.1, 0.1, 0.1)});

	id('curve').onmousedown = function(e) {
		// mouse clicked on curve panel
		//if(e.button != 0) return;

		// calculate correct position relative to canvas
		let rect = e.target.getBoundingClientRect();
		let x = (e.clientX - rect.left);
		let y = (e.clientY - rect.top);

		selectedPoint = -1;
		for(let i=0;i<controlPts.length;i++) {
			let pt = controlPts[i];
			if(Math.abs(pt.x - x) < (dotSize+2) && Math.abs(pt.y - y) < (dotSize+2)) {
				selectedPoint = i;
			}
		}
		targetPoint = -1;
		if(selectedPoint==-1 && curveType == Hermite) {
			for(let i=0;i<controlPts.length;i++) {
				let pt = controlPts[i];
				let tx = pt.x + pt.dx;
				let ty = pt.y + pt.dy;
				if(Math.abs(tx - x) < (dotSize+2) && Math.abs(ty - y) < (dotSize+2)) {
					targetPoint = i;
				}
			}
		}
		if(e.ctrlKey || e.altKey || e.metaKey) {	// if CTRL or ALT or COMMAND key is pressed
			if(selectedPoint==-1) {
				controlPts.push({'x' : x, 'y' : y, 'dx' : panelSize/10, 'dy' : panelSize/10});
				message('added new point at ('+x+','+y+')');
			}
		} else if(e.shiftKey) { // if SHIFT is pressed, delete point
			if(selectedPoint>=0) {
				controlPts.splice(selectedPoint, 1);
				message('deleted point at index '+selectedPoint);
				selectedPoint = -1;
			}
		}
		
		updateCurve();
	}
	
	id('curve').onmousemove = function(e) {
		let rect = e.target.getBoundingClientRect();
		let x = (e.clientX - rect.left);
		let y = (e.clientY - rect.top);

		if(selectedPoint >= 0) {
		
			controlPts[selectedPoint].x = x;
			controlPts[selectedPoint].y = y;
			updateCurve();
		
			message('moved point at index '+selectedPoint);

		} else if(targetPoint >= 0) {
			
			controlPts[targetPoint].dx = x - controlPts[targetPoint].x;
			controlPts[targetPoint].dy = y - controlPts[targetPoint].y;
			updateCurve();
			
		}
	}
		
	id('curve').onmouseup = function(e) {
		selectedPoint = -1;
		targetPoint = -1;
	}

	id('surface').onmousedown = function(e) {
		let rect = e.target.getBoundingClientRect();
		let x = (e.clientX - rect.left);
		let y = (e.clientY - rect.top);
		if(e.button==0) {
			mouseButton = 0;
			mouseClicked = true;
		} else if(e.button==2) {
			mouseButton = 2;
			mouseClicked = true;
		}
	}
	
	id('surface').onmousemove = function(e) {
		prevMouse.x = mouse.x;
		prevMouse.y = mouse.y;
		
		let rect = e.target.getBoundingClientRect();
		mouse.x = (e.clientX - rect.left);
		mouse.y = (e.clientY - rect.top);
		
		if(mouseClicked) {
			if(mouseButton==0) {
				angleV += (mouse.y - prevMouse.y)*0.005;
			} else if(mouseButton==2) {
				scale += (mouse.y - prevMouse.y)*0.002;
			}
			renderSurfaceViewer();		
		}
	}
	
	id('surface').onmouseup = function(e) {
		mouseClicked = false;
		mouseButton = -1;
	}
	
	// remove the following if you don't want to automatically load preset control points
	loadPreset(1);
}

//Defines key/mouse callbacks
window.addEventListener('keydown',  onKeyDown,  false);

