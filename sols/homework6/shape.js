/* Intersection structure:
 * t:        ray parameter (float), i.e. distance of intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
	constructor() {
		this.t = 0;
		this.position = new THREE.Vector3();
		this.normal = new THREE.Vector3();
		this.material = null;
	}
	set(isect) {
		this.t = isect.t;
		this.position = isect.position;
		this.normal = isect.normal;
		this.material = isect.material;
	}
}

/* Plane shape
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
	constructor(P0, n, material) {
		this.P0 = P0.clone();
		this.n = n.clone();
		this.n.normalize();
		this.material = material;
	}
	// Given ray and range [tmin,tmax], return intersection point.
	// Return null if no intersection.
	intersect(ray, tmin, tmax) {
		let temp = this.P0.clone();
		temp.sub(ray.o); // (P0-O)
		let denom = ray.d.dot(this.n); // d.n
		if(denom==0) { return null;	}
		let t = temp.dot(this.n)/denom; // (P0-O).n / d.n
		if(t<tmin || t>tmax) return null; // check range
		let isect = new Intersection();   // create intersection structure
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = this.n;
		isect.material = this.material;
		return isect;
	}
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
	constructor(C, r, material) {
		this.C = C.clone();
		this.r = r;
		this.r2 = r*r;
		this.material = material;
	}
	intersect(ray, tmin, tmax) {
//#begin
		let temp = ray.o.clone();
		temp.sub(this.C);
		let twoa = 2*ray.d.lengthSq();
		let b = 2*ray.d.dot(temp);
		let c = temp.lengthSq()-this.r2;
		let delta = b*b-2*twoa*c;
		if(delta>0) {
			delta = Math.sqrt(delta);
			let t = (-b-delta)/twoa;
			if(t<tmin) t=(-b+delta)/twoa;
			if(t<tmin || t>tmax) return null;
			let isect = new Intersection();
			isect.t = t;
			isect.position = ray.pointAt(t);
			isect.normal = isect.position.clone();
			isect.normal.sub(this.C);
			isect.normal.normalize();
			isect.material = this.material;
			return isect;
		}
//#end
		return null;
	}
}

class Triangle {
	/* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
	 * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
	constructor(P0, P1, P2, material, n0, n1, n2) {
		this.P0 = P0.clone();
		this.P1 = P1.clone();
		this.P2 = P2.clone();
		this.material = material;
		if(n0) this.n0 = n0.clone();
		if(n1) this.n1 = n1.clone();
		if(n2) this.n2 = n2.clone();

		// below you may pre-compute any variables that are needed for intersect function
		// such as the triangle normal etc.
//#begin
		let e1 = P1.clone();
		e1.sub(P0);
		let e2 = P2.clone();
		e2.sub(P0);
		let normal = new THREE.Vector3();
		normal.crossVectors(e1, e2);
		normal.normalize();
		if(this.n0) {} else {this.n0 = normal.clone();}
		if(this.n1) {} else {this.n1 = normal.clone();}
		if(this.n2) {} else {this.n2 = normal.clone();}
//#end		
	} 

	intersect(ray, tmin, tmax) {
//#begin
		let A = this.P0.x - this.P1.x;
		let B = this.P0.y - this.P1.y;
		let C = this.P0.z - this.P1.z;

 		let D = this.P0.x - this.P2.x;
		let E = this.P0.y - this.P2.y;
		let F = this.P0.z - this.P2.z;

		let G = ray.d.x;
		let H = ray.d.y;
		let I = ray.d.z;

		let J = this.P0.x - ray.o.x;
		let K = this.P0.y - ray.o.y;
		let L = this.P0.z - ray.o.z;

		let EIHF = E*I-H*F;
		let GFDI = G*F-D*I;
		let DHEG = D*H-E*G;

		let denom = (A*EIHF + B*GFDI + C*DHEG);

		let beta = (J*EIHF + K*GFDI + L*DHEG) / denom;

		if (beta < 0.0 || beta > 1) 
			return null;

		let AKJB = A*K - J*B;
		let JCAL = J*C - A*L;
		let BLKC = B*L - K*C;

		let gamma = (I*AKJB + H*JCAL + G*BLKC)/denom;
		if (gamma < 0.0 || beta + gamma > 1.0) return null;
   
		let t = -(F*AKJB + E*JCAL + D*BLKC)/denom;
		if (t >= tmin && t <= tmax)
		{
			let alpha = 1-beta-gamma;
			let isect = new Intersection();
			isect.t = t;
			isect.position = ray.pointAt(t);
			isect.normal.copy(this.n0);
			isect.normal.multiplyScalar(alpha);
			isect.normal.addScaledVector(this.n1, beta);
			isect.normal.addScaledVector(this.n2, gamma);
			isect.normal.normalize();
			isect.material = this.material;			
			return isect;
		}
//#end
		return null;
	}
}

function shapeLoadOBJ(objname, material, smoothnormal) {
	loadOBJAsMesh(objname, function(mesh) { // callback function for non-blocking load
		if(smoothnormal) mesh.computeVertexNormals();
		for(let i=0;i<mesh.faces.length;i++) {
			let p0 = mesh.vertices[mesh.faces[i].a];
			let p1 = mesh.vertices[mesh.faces[i].b];
			let p2 = mesh.vertices[mesh.faces[i].c];
			if(smoothnormal) {
				let n0 = mesh.faces[i].vertexNormals[0];
				let n1 = mesh.faces[i].vertexNormals[1];
				let n2 = mesh.faces[i].vertexNormals[2];
				shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2));
			} else {
				shapes.push(new Triangle(p0, p1, p2, material));
			}
		}
	}, function() {}, function() {});
}

/* ========================================
 * You can define additional Shape classes,
 * as long as each implements intersect function.
 * ======================================== */