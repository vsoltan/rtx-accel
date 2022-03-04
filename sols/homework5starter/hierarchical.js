/* CMPSCI 373 Homework 5: Hierarchical Scene */

const width = 800, height = 600;
const fov = 60;
const cameraz = 2;
const aspect = width/height;
const smoothShading = true;
let   animation_speed = 1.0;

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(fov, aspect, 1, 1000);
camera.position.set(0, 1, cameraz);

let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(width, height);
renderer.setClearColor(0x202020);
window.onload = function(e) {
	document.getElementById('window').appendChild(renderer.domElement);
}
let orbit = new THREE.OrbitControls(camera, renderer.domElement);	// create mouse control

let light0 = new THREE.DirectionalLight(0xFFFFFF, 1.0);
light0.position.set(camera.position.x, camera.position.y, camera.position.z);	// this light is at the camera
scene.add(light0);

let light1 = new THREE.DirectionalLight(0x800D0D, 1.0); // red light
light1.position.set(-1, 1, 0);
scene.add(light1);

let light2 = new THREE.DirectionalLight(0x0D0D80, 1.0); // blue light
light2.position.set(1, 1, 0);
scene.add(light2);

let amblight = new THREE.AmbientLight(0x202020);	// ambient light
scene.add(amblight);

let material = new THREE.MeshPhongMaterial({color:0x808080, specular:0x101010, shininess: 50, side:THREE.FrontSide});
let models = []; // array that stores all models
let numModelsLoaded = 0;
let numModelsExpected = 0;

// load OBJ models or create shapes
// ===YOUR CODE STARTS HERE===

// ---YOUR CODE ENDS HERE---
loadOBJ('objs/bunny.obj', material, 'sun');
loadOBJ('objs/bunny.obj', material, 'earth');

// 'label' is a unique name for the model for accessing it later
function loadOBJ(fileName, material, label) {
	numModelsExpected++;
	loadOBJAsMesh(fileName, function(mesh) { // callback function for non-blocking load
		mesh.computeFaceNormals();
		if(smoothShading) mesh.computeVertexNormals();
		models[label] = new THREE.Mesh(mesh, material);
		numModelsLoaded++;
	}, function() {}, function() {});
}

let initialized = false;
function animate() {
	requestAnimationFrame( animate );
	if(numModelsLoaded == numModelsExpected) {	// all models have been loaded
		if(!initialized) {
			initialized = true;
			// construct the scene
// ===YOUR CODE STARTS HERE===

// ---YOUR CODE ENDS HERE---
			scene.add(models['sun']);
			models['earth'].position.x=3;
			scene.add(models['earth']);
		}
		// animate the scene
// ===YOUR CODE STARTS HERE===

// ---YOUR CODE ENDS HERE---
		models['sun'].rotation.y+=0.01*animation_speed;
		models['earth'].rotation.y+=0.05*animation_speed;
	}
	light0.position.set(camera.position.x, camera.position.y, camera.position.z); // light0 always follows camera position
	renderer.render(scene, camera);
}

animate();

function onKeyDown(event) {
	switch(event.key) {
		case 'w':
		case 'W':
			material.wireframe = !material.wireframe;
			break;
		case '=':
		case '+':
			animation_speed += 0.05;
			document.getElementById('msg').innerHTML = 'animation_speed = '+animation_speed.toFixed(2);
			break;
		case '-':
		case '_':
			if(animation_speed>0) animation_speed-=0.05;
			document.getElementById('msg').innerHTML = 'animation_speed = '+animation_speed.toFixed(2);
			break;
		case 'r':
		case 'R':
			orbit.reset();
			break;
	}
}

window.addEventListener('keydown', onKeyDown, false); // as key control if you need
