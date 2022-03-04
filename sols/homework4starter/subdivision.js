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
// ===YOUR CODE STARTS HERE===

// ---YOUR CODE ENDS HERE---
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
