/* CMPSCI 373 Homework 4: Subdivision Surfaces */

const panelSize = 600;
const fov = 35;
const aspect = 1;
let scene, renderer, camera, material, orbit, light, surface=null;
let nsubdiv = 0;

let coarseMesh = null;	// the original input triangle mesh
let currMesh = null;		// current triangle mesh

let flatShading = true;
let wireFrame = false;

let objStrings = [
	box_obj,
	ico_obj,
	torus_obj,
	twist_obj,
	combo_obj,
	pawn_obj,
	bunny_obj,
	head_obj,
	hand_obj,
	klein_obj
];

let objNames = [
	'box',
	'ico',
	'torus',
	'twist',
	'combo',
	'pawn',
	'bunny',
	'head',
	'hand',
	'klein'
];

function id(s) {return document.getElementById(s);}
function message(s) {id('msg').innerHTML=s;}
//#begin_hidden
function makeKey(x, y) {return (x<y)?x*currMesh.vertices.length+y:y*currMesh.vertices.length+x;}
//#end

function subdivide() {
	let currVerts = currMesh.vertices;
	let currFaces = currMesh.faces;
	let newVerts = [];
	let newFaces = [];
	/* You can access the current mesh data through
	 * currVerts and currFaces arrays.
	 * Compute one round of Loop's subdivision and
	 * output to newVerts and newFaces arrays.
	 */
//#begin

	class Edge {
		constructor(_e0, _e1, _f, _s, _m) {
			this.e0 = _e0;
			this.e1 = _e1;
			this.first = _f;
			this.second = _s;
			this.middle = _m;
		}
	};
	let i, j;
	let vertAdj = [];
	let edgeAdj = new Map();
	
	// initialize adjacency matrix and copy old verts to new
	for(i=0;i<currVerts.length;i++) {
		vertAdj[i] = [];
		let v=currVerts[i];
		newVerts.push(new THREE.Vector3(v.x, v.y, v.z));
	}
	for(i=0;i<currFaces.length;i++) {
		let a = currFaces[i].a;
		let b = currFaces[i].b;
		let c = currFaces[i].c;		
		let key = makeKey(a, b);
		if(edgeAdj.has(key)) {
			edgeAdj.get(key).second = c;
		} else {
			vertAdj[a].push(b);
			vertAdj[b].push(a);
			newVerts.push(new THREE.Vector3(0,0,0));
			edgeAdj.set(key, new Edge(a, b, c, -1, newVerts.length-1));
		}
		
		key = makeKey(b, c);
		if(edgeAdj.has(key)) {
			edgeAdj.get(key).second = a;
		} else {
			vertAdj[b].push(c);
			vertAdj[c].push(b);
			newVerts.push(new THREE.Vector3(0,0,0));
			edgeAdj.set(key, new Edge(b, c, a, -1, newVerts.length-1));		
		}
		
		key = makeKey(c, a);
		if(edgeAdj.has(key)) {
			edgeAdj.get(key).second = b;
		} else {
			vertAdj[a].push(c);
			vertAdj[c].push(a);
			newVerts.push(new THREE.Vector3(0,0,0));
			edgeAdj.set(key, new Edge(c, a, b, -1, newVerts.length-1));		
		}
	}

	for(i=0;i<currVerts.length;i++) {
		let k=vertAdj[i].length;
		let cos2=Math.cos(2*Math.PI/k);
		let beta=(5/8.0-(3/8.0+1/4.0*cos2)*(3/8.0+1/4.0*cos2))/k;
		let alpha = 1-beta*k;
		newVerts[i].multiplyScalar(alpha);
		for(j=0;j<k;j++) {
			newVerts[i].addScaledVector(currVerts[vertAdj[i][j]], beta);
		}
	}
	edgeAdj.forEach(function(e, k, m) {
		/*if(e.second==-1) {
			newVerts[e.middle].addScaledVector(currVerts[e.e0], 1/2);
			newVerts[e.middle].addScaledVector(currVerts[e.e1], 1/2);		
		} else*/
		{
			newVerts[e.middle].addScaledVector(currVerts[e.e0], 3/8);
			newVerts[e.middle].addScaledVector(currVerts[e.e1], 3/8);
			newVerts[e.middle].addScaledVector(currVerts[e.first], 1/8);		
			newVerts[e.middle].addScaledVector(currVerts[e.second], 1/8);
		}
	});
	
	for(i=0;i<currFaces.length;i++) {
		let v0 = currFaces[i].a;
		let v1 = currFaces[i].b;
		let v2 = currFaces[i].c;
		let key = makeKey(v0, v1);
		let m01 = edgeAdj.get(key).middle;
		key = makeKey(v1, v2);
		let m12 = edgeAdj.get(key).middle;
		key = makeKey(v2, v0);
		let m20 = edgeAdj.get(key).middle;
		newFaces.push(new THREE.Face3(v0, m01, m20));
		newFaces.push(new THREE.Face3(m01, v1, m12));
		newFaces.push(new THREE.Face3(m20, m12, v2));
		newFaces.push(new THREE.Face3(m12, m20, m01));
	}
//#end
	/* Overwrite current mesh with newVerts and newFaces */
	currMesh.vertices = newVerts;
	currMesh.faces = newFaces;
	/* Update mesh drawing */
	updateSurfaces();
}

window.onload = function(e) {
	// create scene, camera, renderer and orbit controls
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100 );
	camera.position.set(-1, 1, 3);
	
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setSize(panelSize, panelSize);
	renderer.setClearColor(0x202020);
	id('surface').appendChild(renderer.domElement);	// bind renderer to HTML div element
	orbit = new THREE.OrbitControls(camera, renderer.domElement);
	
	light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
	light.position.set(camera.position.x, camera.position.y, camera.position.z);	// right light
	scene.add(light);

	let amblight = new THREE.AmbientLight(0x202020);	// ambient light
	scene.add(amblight);
	
	// create materials
	material = new THREE.MeshPhongMaterial({color:0xCC8033, specular:0x101010, shininess: 50});
	
	// create current mesh object
	currMesh = new THREE.Geometry();
	
	// load first object
	loadOBJ(objStrings[0]);
}

function updateSurfaces() {
	currMesh.verticesNeedUpdate = true;
	currMesh.elementsNeedUpdate = true;
	currMesh.computeFaceNormals(); // compute face normals
	if(!flatShading) currMesh.computeVertexNormals(); // if smooth shading
	else currMesh.computeFlatVertexNormals(); // if flat shading
	
	if (surface!=null) {
		scene.remove(surface);	// remove old surface from scene
		surface.geometry.dispose();
		surface = null;
	}
	material.wireframe = wireFrame;
	surface = new THREE.Mesh(currMesh, material); // attach material to mesh
	scene.add(surface);
}

function loadOBJ(objstring) {
	loadOBJFromString(objstring, function(mesh) {
		coarseMesh = mesh;
		currMesh.vertices = mesh.vertices;
		currMesh.faces = mesh.faces;
		updateSurfaces();
		nsubdiv = 0;
	},
	function() {},
	function() {});
}

function onKeyDown(event) { // Key Press callback function
	switch(event.key) {
		case 'w':
		case 'W':
			wireFrame = !wireFrame;
			message(wireFrame ? 'wireframe rendering' : 'solid rendering');
			updateSurfaces();
			break;
		case 'f':
		case 'F':
			flatShading = !flatShading;
			message(flatShading ? 'flat shading' : 'smooth shading');
			updateSurfaces();
			break;
		case 's':
		case 'S':
		case ' ':
			if(nsubdiv>=5) {
				message('# subdivisions at maximum');
				break;
			}
			subdivide();
			nsubdiv++;
			updateSurfaces();
			message('# subdivisions = '+nsubdiv);
			break;
		case 'e':
		case 'E':
			currMesh.vertices = coarseMesh.vertices;
			currMesh.faces = coarseMesh.faces;
			nsubdiv = 0;
			updateSurfaces();
			message('# subdivisions = '+nsubdiv);
			break;
		case 'r':
		case 'R':
			orbit.reset();
			break;
			
	}
	if(event.key>='0' && event.key<='9') {
		let index = 9;
		if(event.key>'0')	index = event.key-'1';
		if(index<objStrings.length) {
			loadOBJ(objStrings[index]);
			message('loaded mesh '+objNames[index]);
		}
	}
}

window.addEventListener('keydown',  onKeyDown,  false);

function animate() {
	requestAnimationFrame( animate );
	//if(orbit) orbit.update();
	if(scene && camera)	{
		light.position.set(camera.position.x, camera.position.y, camera.position.z);
		renderer.render(scene, camera);
	}
}

animate();
