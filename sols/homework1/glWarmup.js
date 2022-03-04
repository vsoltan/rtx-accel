var scene = new THREE.Scene();
var aspect = window.innerWidth / window.innerHeight;
var camera = new THREE.PerspectiveCamera( 45, aspect, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor(new THREE.Color(0.3, 0.3, 0.3));
document.body.appendChild(renderer.domElement);

var material = new THREE.MeshStandardMaterial( {color: new THREE.Color(1, 0.3, 0.1), side: THREE.DoubleSide} );

var light1 = new THREE.PointLight( new THREE.Color(1, 1, 1), 2, 50 );
light1.position.set(-5, 10, 5);

scene.add(light1);
camera.position.z = 5;

//List of shapes, empty to begin with
var shapes = [];

//Creates a single triangle
var triangle_geometry = new THREE.Geometry();
var v1 = new THREE.Vector3(0.0, 1.5, 0.0);
var v2 = new THREE.Vector3(-1.0, 0.5, 0.0);
var v3 = new THREE.Vector3(1.0, -0.5, 0.0);

triangle_geometry.vertices.push(v1);
triangle_geometry.vertices.push(v2);
triangle_geometry.vertices.push(v3);

triangle_geometry.faces.push(new THREE.Face3(0, 1, 2));
triangle_geometry.computeFaceNormals();

var triangle = new THREE.Mesh(triangle_geometry, material);
shapes.push(triangle); // add the triangle to list of shapes

//Creates torus mesh
var torus_geometry = new THREE.TorusBufferGeometry(1, 0.4, 16, 100);
var torus = new THREE.Mesh(torus_geometry, material);
shapes.push(torus);

//Creates Sphere mesh
var sphere_geometry = new THREE.SphereBufferGeometry(1, 64, 64);
var sphere = new THREE.Mesh(sphere_geometry, material);
shapes.push(sphere);

//Creates Icosahedron mesh
var icosahedron_geometry = new THREE.IcosahedronBufferGeometry();
var icosahedron = new THREE.Mesh(icosahedron_geometry, material);
shapes.push(icosahedron);

//Creates Teapot mesh
var teapot_geometry = new THREE.TeapotBufferGeometry(1);
var teapot = new THREE.Mesh(teapot_geometry, material);
shapes.push(teapot);

//Sets initial shape
var currentShape = triangle;
var currentShapeId = 0;
scene.add(currentShape);

//Transformation parameters
var tx = 0.0;
var ty = 0.0;
var scale = 1.0;
var angleV = 0.0;
var isWireframe = false;

//Mouse variables
var mouse = new THREE.Vector2();
var norm_mouse = new THREE.Vector2();
var prevMouse = new THREE.Vector2();
var mousePressed = false;
var mouseClicked = false;
var mouseButton = 0;
var clickedOnShape = false;

var raycaster = new THREE.Raycaster();

function onMouseMove(event) { // Mouse Move callback function
	// stores previous mouse position
	prevMouse.x = mouse.x
	prevMouse.y = mouse.y

	// calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	norm_mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	norm_mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	
	// calculate mouse position in screen coordinates
	mouse.x = event.clientX;
	mouse.y = event.clientY;
}

function onKeyPress(event) { // Key Press callback function
	if (event.key == ' ') { // space key pressed
		scene.remove(currentShape);
		currentShapeId = (currentShapeId + 1) % shapes.length;
		currentShape = shapes[currentShapeId];
		scene.add(currentShape); // remove previous shape and add next shape to scene 
	}

	if (event.key == 'w') { // w key pressed
		isWireframe = !isWireframe;
	}
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
  // rotate the shape in x, y, z axes respectively
	currentShape.rotation.setFromVector3(new THREE.Vector3(angleV, 0.0, 0.0));
	currentShape.scale.set(scale, scale, scale); // uniform scaling
	currentShape.material.wireframe = isWireframe;

  /* Written Question:
   * How does the program detect whether mouse pointer is clicked on the shape?
   * Your answer in 1-2 sentences: 
   */
	if (mouseClicked) {
	
		raycaster.setFromCamera(norm_mouse, camera);
		var intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			clickedOnShape = true;
		} else {
		  clickedOnShape = false;
		}

		//Set click to false so we don't detect a click in next iteration
		mouseClicked = false;
	}
	if (clickedOnShape && mouseButton == 0) { // update vertical rotation angle
		var dy = mouse.y - prevMouse.y;
		angleV += dy*0.01;
	}
	
	if (clickedOnShape && mouseButton == 2)	{ // update scaling
		var dy = mouse.y - prevMouse.y;
		scale -= dy*0.01;
	}
	
	if (clickedOnShape && mouseButton == 1) { // update translation
		var dy = mouse.y - prevMouse.y;
		var dx = mouse.x - prevMouse.x;
		currentShape.position.x += dx*0.01;
		currentShape.position.y -= dy*0.01;
	}

	renderer.render(scene, camera);
}

animate();

//Defines callbacks
window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'mousedown', 
	function (event) { 
		if (!mousePressed){
			mouseClicked = true;
		}
		mousePressed = true; 
		mouseButton = event.button
	}, 
	false );
window.addEventListener( 'mouseup',
	function (event) { 
		clickedOnShape = false; 
		mouseClicked = false; 
		mousePressed = false; 
	}, false );
window.addEventListener('keypress', onKeyPress, false);

