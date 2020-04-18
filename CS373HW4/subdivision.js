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

let edgesTest = new Map();

let objNames = [
	'objs/box.obj',
	'objs/ico.obj',
	'objs/torus.obj',
	'objs/twist.obj',
	'objs/combo.obj',
	'objs/pawn.obj',
	'objs/bunny.obj',
	'objs/head.obj',
	'objs/hand.obj',
	'objs/klein.obj'
];

function id(s) {return document.getElementById(s);}
function message(s) {id('msg').innerHTML=s;}

function addNeighbors(adjList, face) {
	let a = face.a, b = face.b, c = face.c;

	adjList[a].add(b); adjList[a].add(c);
	adjList[b].add(a); adjList[b].add(c);
	adjList[c].add(a); adjList[c].add(b);
}

function getEdge(v1, v2) {
	let e1 = 0, e2 = 0;

	v1 < v2 ? (e1 = v1, e2 = v2) : (e1 = v2, e2 = v1);

	return e1 + "," + e2;
}

// v is the adjacent vertext to the edge
function createEdge(edgeMap, v0, v1, v2) {
	let edge = getEdge(v0, v1);

	// edge is encountered in reverse order, add other neighbor node n1
	if (edgeMap.has(edge)) {
			edgeMap.get(edge).n1 = v2;
	} else {
			edgeMap.set(edge, {v0: v0, v1: v1, n0: v2, n1: -1, mp: -1});
	}
}

function addEdges(edgeMap, face) {
	let a = face.a, b = face.b, c = face.c;

	createEdge(edgeMap, a, b, c);
	createEdge(edgeMap, a, c, b);
	createEdge(edgeMap, b, c, a);
}

function getNewVertex(vertList, edgeMap, edgeHash, edge) {
	let v0 = vertList[edge.v0];
	let v1 = vertList[edge.v1];
	let n0 = vertList[edge.n0];
	let n1 = vertList[edge.n1];

	edgeMap.get(edgeHash).mp = vertList.length;

	let new_x = 3 * (v0.x + v1.x) / 8 + (n0.x + n1.x) / 8;
	let new_y = 3 * (v0.y + v1.y) / 8 + (n0.y + n1.y) / 8;
	let new_z = 3 * (v0.z + v1.z) / 8 + (n0.z + n1.z) / 8;

	return new THREE.Vector3(new_x, new_y, new_z);
}

function updateVertex(v, c) {
	return new THREE.Vector3(c * v.x, c * v.y, c * v.z);
}

function loopsRule(k) {
	if (k >= 3) {
		return 1 / k * (5 / 8 - (3 / 8 + 1 / 4 * Math.cos(2 * Math.PI / k)) ** 2);
	} else {
		console.log("shape is not manifold!");
	}
}

function updateOldVertex(adjList, vertList, v) {

	let neighbors = adjList[v];

	let degree = neighbors.size;

	let beta = loopsRule(degree);

	let new_x = vertList[v].x * (1 - degree * beta);
	let new_y = vertList[v].y * (1 - degree * beta);
	let new_z = vertList[v].z * (1 - degree * beta);

	for (let n of neighbors) {
		new_x += vertList[n].x * beta;
		new_y += vertList[n].y * beta;
		new_z += vertList[n].z * beta;
	}

	vertList[v] = new THREE.Vector3(new_x, new_y, new_z);
}

function subdivide() {
	let currVerts = currMesh.vertices;
	let currFaces = currMesh.faces;
	let newVerts = [];
	let newFaces = [];

	let vertexAdj = []; // index --> neighbors
	let meshEdges = new Map();

	// clone the vertices into the new array
	for (let i = 0; i < currVerts.length; i++) {

		let v = currVerts[i];
		newVerts.push(v.clone());

		// create neightbor sets for each vertex
		vertexAdj.push(new Set());
	}

	// add adjacent vertices to neighbor list
	for (let j = 0; j < currFaces.length; j++) {
		let f = currFaces[j];

		addNeighbors(vertexAdj, f);
		addEdges(meshEdges, f);
	}

	for (let [k, v] of meshEdges) {
		newVerts.push(getNewVertex(newVerts, meshEdges, k, v));
	}

	for (let i = 0; i < currVerts.length; i++) {
		updateOldVertex(vertexAdj, newVerts, i);
	}

	for (let i = 0; i < currFaces.length; i++) {
		let f = currFaces[i];

		let a = f.a, b = f.b, c = f.c;

		let kIndex = meshEdges.get(getEdge(a, b)).mp;

		let lIndex = meshEdges.get(getEdge(b, c)).mp;

		let mIndex = meshEdges.get(getEdge(a, c)).mp;

		newFaces.push(new THREE.Face3(a, kIndex, mIndex));
		newFaces.push(new THREE.Face3(kIndex, b, lIndex));
		newFaces.push(new THREE.Face3(kIndex, lIndex, mIndex));
		newFaces.push(new THREE.Face3(mIndex, lIndex, c));
	}

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
	loadOBJ(objNames[0]);
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

function loadOBJ(name) {
	loadOBJAsMesh(name, function(mesh) {
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
		if(index<objNames.length) {
			loadOBJ(objNames[index]);
			message('loaded file '+objNames[index]);
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
