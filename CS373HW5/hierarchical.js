/* CMPSCI 373 Homework 5: Hierarchical Scene */

const width = 800, height = 600;
const fov = 60;
const cameraz = 5;
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

let lightMaterial = new THREE.MeshBasicMaterial( { color: 0xFFA500 } );
let huntBirdMaterial = new THREE.MeshBasicMaterial( { color: 0xFF0000 } );
let birdMaterial = new THREE.MeshBasicMaterial( { color: 0xFFFF00 } );

let lhMaterial = new THREE.MeshPhongMaterial( { color: 0xb0b8bc, specular: 0x111111, shininess: 32} );
let boatMaterial = new THREE.MeshPhongMaterial( { color: 0x42393c, specular: 0x282727, shininess: 30 } );
let fishMaterial = new THREE.MeshPhongMaterial( { color: 0x6350ad, specular: 0x923aa8, shininess: 155 } );

let models = []; // array that stores all models
let numModelsLoaded = 0;
let numModelsExpected = 0;

// load OBJ models or create shapes

let lightGeo = new THREE.ConeGeometry( 0.2, 1, 32 );
let lightObj = new THREE.Mesh(lightGeo, lightMaterial);

let waterGeo = new THREE.BoxGeometry(20, 1, 15);

let loader = new THREE.TextureLoader();
const waterMaterial = new THREE.MeshBasicMaterial({
  map: loader.load('textures/water2.jpg'),
});

let water = new THREE.Mesh(waterGeo, waterMaterial);

loadOBJ('objs/lighthouse.obj', lhMaterial, 'lh');
loadOBJ('objs/boat.obj', boatMaterial, 'boat');
loadOBJ('objs/trout.obj', fishMaterial, 'fish');
loadOBJ('objs/trout.obj', fishMaterial, 'fish2');
loadOBJ('objs/trout.obj', fishMaterial, 'fish3');
loadOBJ('objs/bird.obj', huntBirdMaterial, 'bird');
loadOBJ('objs/bird.obj', birdMaterial, 'bird2');
loadOBJ('objs/bird.obj', birdMaterial, 'bird3');

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

// initialize groups for the scene

let lightGroup = new THREE.Group();
let boatGroup = new THREE.Group();
let fishGroup = new THREE.Group();
let birdGroup = new THREE.Group();
let huntingBirdGroup = new THREE.Group();

let theta = 0;
let alpha = 0;

function animate() {

	requestAnimationFrame( animate );
	if(numModelsLoaded == numModelsExpected) {	// all models have been loaded
		if(!initialized) {
			initialized = true;

			let lighthouse = models['lh'];
			let boat = models['boat'];
			let fish = models['fish'];
			let fish2 = models['fish2'];
			let fish3 = models['fish3'];
			let bird = models['bird'];
			let bird2 = models['bird2'];
			let bird3 = models['bird3'];

			// construct the scene

			water.position.y = -1.5;

			lighthouse.rotation.x = -Math.PI / 2; // make lighthouse upright

			lightObj.position.x = lighthouse.scale.x / 2;
			lightObj.position.y = lighthouse.scale.y - 0.45;

			lightObj.rotation.z = Math.PI / 2;

			boat.position.set(0, -0.95, 0);
			boat.rotation.z = 2 * Math.PI / 5;
			boat.rotation.x = -Math.PI / 2;
			boat.scale.set(0.5, 0.5, 0.5);

			fish.scale.set(0.3, 0.3, 0.3);
			fish.position.set(0.6, -1.05, 0.1);
			fish.rotation.x = -Math.PI / 2;
			fish.rotation.z = -Math.PI / 2;

			fish2.scale.set(0.3, 0.3, 0.3);
			fish2.position.set(0.75, -1.05, 0.2);
			fish2.rotation.x = -Math.PI / 2;
			fish2.rotation.z = -Math.PI / 2;

			fish3.scale.set(0.3, 0.3, 0.3);
			fish3.position.set(0.9, -1.05, 0.3);
			fish3.rotation.x = -Math.PI / 2;
			fish3.rotation.z = -Math.PI / 2;

			bird.scale.set(0.2, 0.2, 0.2);
			bird.position.set(0.8, 0, 0.6);
			bird.rotation.y = Math.PI;

			bird2.scale.set(0.2, 0.2, 0.2);
			bird2.position.set(0.7, 0.2, 0)
			bird2.rotation.y = Math.PI;

			bird3.scale.set(0.2, 0.2, 0.2);
			bird3.position.set(0.3, 0.2, 0)

			huntingBirdGroup.add(bird);

			birdGroup.add(bird2);
			birdGroup.add(bird3);

			fishGroup.add(fish);
			fishGroup.add(fish2);
			fishGroup.add(fish3);
			fishGroup.add(birdGroup);
			fishGroup.add(huntingBirdGroup);

			boatGroup.add(boat);
			boatGroup.add(fishGroup);
			boatGroup.position.x = 2;

			lightGroup.add(lighthouse);
			lightGroup.add(lightObj);
			lightGroup.add(boatGroup);

			scene.add(lightGroup);
			scene.add(water);
		}

		// animate the scene
		lightGroup.rotation.y += 0.01 * animation_speed;
		fishGroup.rotation.y += 0.02 * animation_speed;
		boatGroup.rotation.x = 1 / 6 * Math.sin(alpha);
		birdGroup.rotation.y += 0.005 * animation_speed;
		huntingBirdGroup.position.y = 1 / 2 * Math.cos(theta) - 1 / 2;

		theta += 0.05;
		alpha += 0.03;
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
