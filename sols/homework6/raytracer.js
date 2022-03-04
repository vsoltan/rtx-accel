/* Ray class:
 * o: origin (THREE.Vector3)
 * d: normalized direction (THREE.Vector3)
 */
class Ray {
	constructor(origin, direction) {
		this.o = origin.clone();
		this.d = direction.clone();
		this.d.normalize();
	}
	pointAt(t) {
		// P(t) = o + t*d
		let point = this.o.clone();
		point.addScaledVector(this.d, t);
		return point;
	}
	direction() { return this.d; }
	origin() { return this.o; }
}

function render() {
	// create canvas of size imageWidth x imageHeight and add to DOM
	let canvas = document.createElement('canvas');
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	canvas.style = 'background-color:red';
	document.body.appendChild(canvas);
	let ctx2d = canvas.getContext('2d'); // get 2d context
	let image = ctx2d.getImageData(0, 0, imageWidth, imageHeight); // get image data
	let pixels = image.data; // get pixel array

	let row=0;
	let idx=0;
	let chunksize=10; // render 10 rows at a time
	console.log('Raytracing started...');
	(function chunk() {
		// render a chunk of rows
		for(let j=row;j<row+chunksize && j<imageHeight;j++) {
			for(let i=0;i<imageWidth;i++,idx+=4) { // i loop
				// compute normalized pixel coordinate (x,y)
				let x = i/imageWidth;
				let y = (imageHeight-1-j)/imageHeight;
				let ray = camera.getCameraRay(x,y);
				let color = raytracing(ray, 0);
				setPixelColor(pixels, idx, color);
			}
		}
		row+=chunksize;  // non-blocking j loop
		if(row<imageHeight) {
			setTimeout(chunk, 0);
			ctx2d.putImageData(image, 0, 0); // display intermediate image
		} else {
			ctx2d.putImageData(image, 0, 0); // display final image
			console.log('Done.')
		}
	})();
}

/* Trace ray in the scene and return color of ray. 'depth' is the current recursion depth.
 * If intersection material has non-null kr or kt, perform recursive ray tracing. */
function raytracing(ray, depth) {
	let color = new THREE.Color(0,0,0);
//#begin
	let isect = rayIntersectScene(ray);
	if(isect != null) {
		if(isect.material.kr!=null || isect.material.kt!=null) {
			if(depth < maxDepth) {
				if(isect.material.kr!=null && ray.d.dot(isect.normal) < 0) {
					let v = ray.d.clone();
					v.negate();
					let reflRay = new Ray(isect.position, reflect(v, isect.normal));
					let cc = raytracing(reflRay, depth+1);
					cc.multiply(isect.material.kr);
					color.add(cc);
				}
				if(isect.material.kt!=null) {
					let refrDir = refract(ray.d, isect.normal, isect.material.ior);
					if(refrDir!=null) {
						let refrRay = new Ray(isect.position, refrDir);
						let cc = raytracing(refrRay, depth+1);
						cc.multiply(isect.material.kt);
						color.add(cc);
					}

				}

			}
		} else {
			let ia = ambientLight.clone();
			if(isect.material.ka!=null) {
				ia.multiply(isect.material.ka);
				color.add(ia);
				color.add(shading(ray, isect));
			}
		}
	} else { // {
		color = backgroundColor;
	}
//#end
	return color;
}

/* Compute and return shading color given a ray and the intersection point structure. */
function shading(ray, isect) {
	let color = new THREE.Color(0,0,0);
//#begin
	let L = new THREE.Vector3();
	let l = new THREE.Vector3();

	let v = ray.d.clone();
	v.negate();
	let n = isect.normal;
	for(let i=0;i<lights.length;i++) {
		let lightSample = lights[i].getLight(isect.position);
		if(lightSample != null) {
			let L = lightSample.position;
			let l = lightSample.direction;
			let I = lightSample.intensity;
			let shadowRay = new Ray(isect.position, l);
			let line = L.clone();
			line.sub(isect.position);
			let lightDist = line.length();
			let shadow_isect = rayIntersectScene(shadowRay);
			if(shadow_isect && shadow_isect.t < lightDist) {
				continue;
			}
			let ndotl = n.dot(l);
			if(ndotl>0) {
				let diff = isect.material.kd.clone();
				diff.multiply(I);
				diff.multiplyScalar(ndotl);
				color.add(diff);
			}
			let r = reflect(l, isect.normal);
			let rdotv = r.dot(v);
			if(rdotv>0 && isect.material.ks != null) {
				let spec = isect.material.ks.clone();
				spec.multiply(I);
				spec.multiplyScalar(Math.pow(rdotv, isect.material.p));
				color.add(spec);
			}
		}
	}
//#end
	return color;
}

/* Compute intersection of ray with scene shapes.
 * Return intersection structure (null if no intersection). */
function rayIntersectScene(ray) {
	let tmax = Number.MAX_VALUE;
	let isect = null;
	for(let i=0;i<shapes.length;i++) {
		let hit = shapes[i].intersect(ray, 0.0001, tmax);
		if(hit != null) {
			tmax = hit.t;
			if(isect == null) isect = hit; // if this is the first time intersection is found
			else isect.set(hit); // update intersection point
		}
	}
	return isect;
}

/* Compute reflected vector, by mirroring l around n. */
function reflect(l, n) {
	// r = 2(n.l)*n-l
	let r = n.clone();
	r.multiplyScalar(2*n.dot(l));
	r.sub(l);
	return r;
}

/* Compute refracted vector, given l, n and index_of_refraction. */
function refract(l, n, ior) {
	let mu = (n.dot(l) < 0) ? 1/ior:ior;
	let cosI = l.dot(n);
	let sinI2 = 1 - cosI*cosI;
	if(mu*mu*sinI2>1) return null;
	let sinR = mu*Math.sqrt(sinI2);
	let cosR = Math.sqrt(1-sinR*sinR);
	let r = n.clone();
	if(cosI > 0) {
		r.multiplyScalar(-mu*cosI+cosR);
		r.addScaledVector(l, mu);
	} else {
		r.multiplyScalar(-mu*cosI-cosR);
		r.addScaledVector(l, mu);
	}
	r.normalize();
	return r;
}

/* Convert floating-point color to integer color and assign it to the pixel array. */
function setPixelColor(pixels, index, color) {
	pixels[index+0]=pixelProcess(color.r);
	pixels[index+1]=pixelProcess(color.g);
	pixels[index+2]=pixelProcess(color.b);
	pixels[index+3]=255; // alpha channel is always 255*/
}

/* Multiply exposure, clamp pixel value, then apply gamma correction. */
function pixelProcess(value) {
	value*=exposure; // apply exposure
	value=(value>1)?1:value;
	value = Math.pow(value, 1/2.2);	// 2.2 gamma correction
	return value*255;
}
