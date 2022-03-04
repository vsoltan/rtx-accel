/* Three.js Playground */

const panelSize = 800;
const fov = 30;
const aspect = 1;
let scene, renderer, camera, material;
let surface = null;	// surface of revolution
let mesh = null;
let level = 1;
const selfShadow = false;
const Tetra=1, Cube=2, Sphere=3;
let fractalType = Tetra;

// Transformation parameters for surface rendering
let scale = 1.0;
let angleV = 0.0;
let angleH = 0.0;

// Mouse variables
var mouse = new THREE.Vector2();
var prevMouse = new THREE.Vector2();
let mouseClicked = false;
let mouseButton = -1;

function sTetra(P, s, l, mesh) {
	let v = [
		new THREE.Vector3(P.x, P.y, P.z),
		new THREE.Vector3(P.x-s/2, P.y-Math.sqrt(2/3)*s, P.z+s/2/Math.sqrt(3)),
		new THREE.Vector3(P.x+s/2, P.y-Math.sqrt(2/3)*s, P.z+s/2/Math.sqrt(3)),
		new THREE.Vector3(P.x, P.y-Math.sqrt(2/3)*s, P.z-s/Math.sqrt(3))
	];
	if(l==1) {
		let i = mesh.vertices.length;
		mesh.vertices.push(v[0]);
		mesh.vertices.push(v[1]);
		mesh.vertices.push(v[2]);
		mesh.vertices.push(v[3]);
		
		console.log(v);
		mesh.faces.push(new THREE.Face3(i+0, i+1, i+2));
		mesh.faces.push(new THREE.Face3(i+0, i+2, i+3));
		mesh.faces.push(new THREE.Face3(i+0, i+3, i+1));
		mesh.faces.push(new THREE.Face3(i+1, i+3, i+2));
		return;
	}
	sTetra(P, s/2, l-1, mesh);
	sTetra(new THREE.Vector3((v[0].x+v[1].x)/2,(v[0].y+v[1].y)/2,(v[0].z+v[1].z)/2), s/2, l-1, mesh);
	sTetra(new THREE.Vector3((v[0].x+v[2].x)/2,(v[0].y+v[2].y)/2,(v[0].z+v[2].z)/2), s/2, l-1, mesh);
	sTetra(new THREE.Vector3((v[0].x+v[3].x)/2,(v[0].y+v[3].y)/2,(v[0].z+v[3].z)/2), s/2, l-1, mesh);			
}

function sCube(mx, my, mz, s, l, mesh) {
	let MX=mx+s, MY=my+s, MZ=mz+s;
	let v = [
		new THREE.Vector3(mx, my, mz),
		new THREE.Vector3(mx, my, MZ),
		new THREE.Vector3(MX, my, MZ),
		new THREE.Vector3(MX, my, mz),
		new THREE.Vector3(mx, MY, mz),
		new THREE.Vector3(mx, MY, MZ),
		new THREE.Vector3(MX, MY, MZ),
		new THREE.Vector3(MX, MY, mz)
	];
	if(l==1) {
		let i = mesh.vertices.length;
		mesh.vertices.push(v[0]);
		mesh.vertices.push(v[1]);
		mesh.vertices.push(v[2]);
		mesh.vertices.push(v[3]);
		mesh.vertices.push(v[4]);
		mesh.vertices.push(v[5]);
		mesh.vertices.push(v[6]);
		mesh.vertices.push(v[7]);

		mesh.faces.push(new THREE.Face3(i+0, i+2, i+1));
		mesh.faces.push(new THREE.Face3(i+0, i+3, i+2));
		mesh.faces.push(new THREE.Face3(i+4, i+5, i+6));
		mesh.faces.push(new THREE.Face3(i+4, i+6, i+7));
		mesh.faces.push(new THREE.Face3(i+4, i+0, i+1));
		mesh.faces.push(new THREE.Face3(i+4, i+1, i+5));
		mesh.faces.push(new THREE.Face3(i+5, i+1, i+2));
		mesh.faces.push(new THREE.Face3(i+5, i+2, i+6));	
		mesh.faces.push(new THREE.Face3(i+6, i+2, i+3));
		mesh.faces.push(new THREE.Face3(i+6, i+3, i+7));
		mesh.faces.push(new THREE.Face3(i+7, i+3, i+0));
		mesh.faces.push(new THREE.Face3(i+7, i+0, i+4));
		return;
	}
	sCube(mx, my+2/3*s, mz, s/3, l-1, mesh);
	sCube(mx+1/3*s, my+2/3*s, mz, s/3, l-1, mesh);
	sCube(mx+2/3*s, my+2/3*s, mz, s/3, l-1, mesh);

	sCube(mx, my+2/3*s, mz+1/3*s, s/3, l-1, mesh);
	sCube(mx+2/3*s, my+2/3*s, mz+1/3*s, s/3, l-1, mesh);				

	sCube(mx, my+2/3*s, mz+2/3*s, s/3, l-1, mesh);
	sCube(mx+1/3*s, my+2/3*s, mz+2/3*s, s/3, l-1, mesh);
	sCube(mx+2/3*s, my+2/3*s, mz+2/3*s, s/3, l-1, mesh);

	sCube(mx, my, mz, s/3, l-1, mesh);
	sCube(mx+1/3*s, my, mz, s/3, l-1, mesh);
	sCube(mx+2/3*s, my, mz, s/3, l-1, mesh);

	sCube(mx, my, mz+1/3*s, s/3, l-1, mesh);
	sCube(mx+2/3*s, my, mz+1/3*s, s/3, l-1, mesh);				

	sCube(mx, my, mz+2/3*s, s/3, l-1, mesh);
	sCube(mx+1/3*s, my, mz+2/3*s, s/3, l-1, mesh);
	sCube(mx+2/3*s, my, mz+2/3*s, s/3, l-1, mesh);
	
	sCube(mx, my+1/3*s, mz, s/3, l-1, mesh);
	sCube(mx+2/3*s, my+1/3*s, mz, s/3, l-1, mesh);

	sCube(mx, my+1/3*s, mz+2/3*s, s/3, l-1, mesh);
	sCube(mx+2/3*s, my+1/3*s, mz+2/3*s, s/3, l-1, mesh);
}

function createSurface() {
	if (surface!=null) {
		scene.remove(surface);	// remove old surface from scene
		surface = null;
	}

	mesh = new THREE.Geometry(); // create new mesh object 
	switch(fractalType) {
	case Tetra:
		sTetra(new THREE.Vector3(0, 1, 0), 2, level, mesh);
		break;
	case Cube:
		sCube(-0.6, -0.6, -0.6, 1.2, level, mesh);
		break;
	}

	mesh.computeFaceNormals(); // create mesh normal

	surface = new THREE.Mesh(mesh, material); // attach material to mesh
	surface.castShadow = true;
	surface.receiveShadow = selfShadow;

	scene.add(surface);	// add surface to scene
	renderSurface();
}

function renderSurface() {
	if(surface!=null) {
		scene.rotation.setFromVector3(new THREE.Vector3(angleV, angleH, 0.0));
		scene.scale.set(scale, scale, scale);
		camera.updateProjectionMatrix();
		renderer.render(scene, camera);
	}
}

function onKeyDown(event) { // Key Press callback function
	switch(event.key) {
		case 'w':
		case 'W':
			material.wireframe = !material.wireframe;
			message(material.wireframe ? 'wireframe rendering' : 'solid rendering');
			renderSurface();
			break;
		case '=':
			level++;
			message('level = '+level);
			createSurface();
			break;
		case '-':
			if(level>1) level--;
			message('level = '+level);
			createSurface();
			break;
		case '1':
			fractalType = Tetra;
			level = 1;
			message('Tetra');
			createSurface();
			break;
		case '2':
			fractalType = Cube;
			level = 1;
			message('Cube');
			createSurface();
			break;
		case '3':
			fractalType = Sphere;
			level = 1;
			message('Sphere');
			createSurface();
			break;
	}
}

function id(s) {return document.getElementById(s);}
function message(s) {id('msg').innerHTML=s;}

window.onload = function(e) {
	// create scene and set up camera
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000 );
	camera.position.x=0;
	camera.position.y=5;
	camera.position.z=3;
	camera.lookAt(new THREE.Vector3(0,0,0));
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	renderer.setSize(panelSize, panelSize);
	renderer.setClearColor(new THREE.Color(0.3, 0.3, 0.3));
	id('surface').appendChild(renderer.domElement);
	
	// create lighting
	//let light = new THREE.PointLight(0xFFFFFF, 1.0, 0, 1);
	let light = new THREE.DirectionalLight(0xFFFFFF, 2.0);
	light.position.set(2, 5, 2);
	light.castShadow = true;
	light.shadow.mapSize.width=512;
	light.shadow.mapSize.height = 512;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far=100;

	scene.add( light );

	light = new THREE.DirectionalLight(0xFFFFFF, 2.0);
	light.position.set(-2, 5, 2);
	light.castShadow = true;
	light.shadow.mapSize.width=512;
	light.shadow.mapSize.height = 512;
	light.shadow.camera.near = 0.1;
	light.shadow.camera.far=100;
	scene.add( light );
	
	light = new THREE.AmbientLight(0x404040);
	scene.add(light);
	
	let plane = new THREE.PlaneBufferGeometry(2.5,2.5, 1, 1);
	let planeMaterial = new THREE.MeshLambertMaterial({color: 0x202040, side:THREE.DoubleSide});
	let planeMesh = new THREE.Mesh(plane, planeMaterial);
	planeMesh.position.set(0, -0.65, 0);
	planeMesh.rotation.setFromVector3(new THREE.Vector3(Math.PI/2, 0.0, 0.0));
	planeMesh.receiveShadow = true;
	scene.add(planeMesh);

	// create material
	//material = new THREE.MeshLambertMaterial({color: new THREE.Color(0.5, 0.8, 0.2), side:THREE.DoubleSide});
	material = new THREE.MeshStandardMaterial( {
		color: new THREE.Color(0.3, 0.6, 0.1),
		roughness: 0.8,
		metalness: 0.6,
		transparent: true,
		opacity: 0.9
	});		
	
	createSurface();
	
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
				angleH += (mouse.x - prevMouse.x)*0.005;
			} else if(mouseButton==2) {
				scale += (mouse.y - prevMouse.y)*0.002;
			}
			renderSurface();		
		}
	}
	
	id('surface').onmouseup = function(e) {
		mouseClicked = false;
		mouseButton = -1;
	}
}

//Defines key/mouse callbacks
window.addEventListener('keydown',  onKeyDown,  false);

