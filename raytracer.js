/* Ray class:
 * o: origin (THREE.Vector3)
 * d: normalized direction (THREE.Vector3)
 */
class Ray {
    constructor (origin, direction) {
        this.o = origin.clone()
        this.d = direction.clone()
        this.d.normalize()
    }
    pointAt (t) {
        // P(t) = o + t*d
        let point = this.o.clone()
        point.addScaledVector(this.d, t)
        return point
    }
    direction () { return this.d }
    origin () { return this.o }
}

function render () {
    // create canvas of size imageWidth x imageHeight and add to DOM
    let canvas = document.createElement('canvas')
    canvas.width = imageWidth
    canvas.height = imageHeight
    canvas.style = 'background-color:red'
    document.body.appendChild(canvas)
    let ctx2d = canvas.getContext('2d') // get 2d context
    let image = ctx2d.getImageData(0, 0, imageWidth, imageHeight) // get image data
    let pixels = image.data // get pixel array

    let row = 0
    let idx = 0
    let chunksize = 10 // render 10 rows at a time
    let sampleSize = 1 // dimension of super-sampling, default = 1, 4 = 4x4 SS
    let tree = null

    if (accel) { tree = constructBVHTree(shapes, 0) }

    console.log('Raytracing started...');
    (function chunk () {
        // render a chunk of rows
        for (let j = row; j < row + chunksize && j < imageHeight; j++) {
            for (let i = 0; i < imageWidth; i++, idx += 4) { // i loop

                let color = new THREE.Color(0, 0, 0)

                // super sampling
                for (let k = 1; k <= sampleSize; k++) {
                    for (let l = 1; l <= sampleSize; l++) {
                        // compute normalized pixel coordinate (x,y)
                        let x = (i + k / sampleSize) / (imageWidth)
                        let y = (imageHeight - 1 - j + l / sampleSize) / imageHeight

                        let ray = camera.getCameraRay(x, y)
                        color.add(raytracing(ray, tree, 0))
                    }
                }
                color.multiplyScalar(1 / sampleSize ** 2)
                setPixelColor(pixels, idx, color)
            }
        }
        row += chunksize  // non-blocking j loop
        if (row < imageHeight) {
            setTimeout(chunk, 0)
            ctx2d.putImageData(image, 0, 0) // display intermediate image
        } else {
            ctx2d.putImageData(image, 0, 0) // display final image
            console.log('Done.')
            console.log('num comparisons: ', numComparisons)
            t2 = new Date().getTime()
            console.log("time to trace: ", t2 - t1 + " milliseconds");
        }
    })()
}

// trace ray in the scene and return color of ray. 'depth' is the current recursion depth.
function raytracing (ray, tree, depth) {
    let color = new THREE.Color(0, 0, 0)
    let objs = getObjs(ray, tree)
    let isect = rayIntersectScene(ray, objs)

    if (isect) {
        if ((isect.material.kr || isect.material.kt) && (depth < maxDepth)) {
            if (isect.material.kr) {
                let reflectedRay = new Ray(isect.position, reflect(ray.d.clone().multiplyScalar(-1), isect.normal))
                color.add(raytracing(reflectedRay, tree, depth + 1).multiply(isect.material.kr))
            }
            if (isect.material.kt) {
                let refractedRay = new Ray(isect.position, refract(ray.d.clone(), isect.normal, isect.material.ior))
                color.add(raytracing(refractedRay, tree, depth + 1).multiply(isect.material.kt))
            }
        } else {
            color.add(shading(ray, tree, isect))
        }
    } else {
        return backgroundColor
    }
    return color
}

/* Compute and return shading color given a ray and the intersection point structure. */
function shading (ray, tree, isect) {
    let color = new THREE.Color(0, 0, 0)

    if (isect.material.ka) {
        let ambient = ambientLight.clone().multiply(isect.material.ka)
        color.add(ambient)
    }

    for (let i = 0; i < lights.length; i++) {
        let ls = lights[i].getLight(isect.position)
        let shadowRay = new Ray(isect.position, ls.direction)

        let toLight = ls.position.clone().sub(isect.position)
        let distToLight = toLight.length()

        let objs = getObjs(shadowRay, tree)
        let isectShadow = rayIntersectScene(shadowRay, objs)

        if (isectShadow && (isectShadow.t < distToLight)) { continue }

        let l = ls.direction, n = isect.normal, v = ray.d.clone().multiplyScalar(-1)
        let r = reflect(l, n), Ij = ls.intensity

        if (isect.material.kd) {
            let kd = isect.material.kd
            let diffuse = Ij.clone().multiply(kd).multiplyScalar(Math.max(n.dot(l), 0))
            color.add(diffuse)
        }

        if (isect.material.ks) {
            let ks = isect.material.ks, p = isect.material.p
            let specular = Ij.clone().multiply(ks).multiplyScalar(Math.max(r.dot(v), 0) ** p)
            color.add(specular)
        }
    }
    return color
}

function getObjs (ray, tree) {
    if (tree) {
        return tree.getIntersection(ray).concat(planes)
    } else { return shapes }
}

/* Compute intersection of ray with scene shapes.
 * Return intersection structure (null if no intersection). */
function rayIntersectScene (ray, objs) {
    let tmax = Number.MAX_VALUE
    let isect = null

    for (let i = 0; i < objs.length; i++) {
        numComparisons += 1
        let hit = objs[i].intersect(ray, 0.0001, tmax)
        if (hit != null) {
            tmax = hit.t
            if (isect == null) isect = hit // if this is the first time intersection is found
            else isect.set(hit) // update intersection point
        }
    }
    return isect
}

/* Compute reflected vector, by mirroring l around n. */
function reflect (l, n) {
    // r = 2(n.l)*n-l
    let r = n.clone()
    r.multiplyScalar(2 * n.dot(l))
    r.sub(l)
    return r
}

/* Compute refracted vector, given l, n and index_of_refraction. */
function refract (l, n, ior) {
    let mu = (n.dot(l) < 0) ? 1 / ior : ior
    let cosI = l.dot(n)
    let sinI2 = 1 - cosI * cosI
    if (mu * mu * sinI2 > 1) return null
    let sinR = mu * Math.sqrt(sinI2)
    let cosR = Math.sqrt(1 - sinR * sinR)
    let r = n.clone()
    if (cosI > 0) {
        r.multiplyScalar(-mu * cosI + cosR)
        r.addScaledVector(l, mu)
    } else {
        r.multiplyScalar(-mu * cosI - cosR)
        r.addScaledVector(l, mu)
    }
    r.normalize()
    return r
}

/* Convert floating-point color to integer color and assign it to the pixel array. */
function setPixelColor (pixels, index, color) {
    pixels[index + 0] = pixelProcess(color.r)
    pixels[index + 1] = pixelProcess(color.g)
    pixels[index + 2] = pixelProcess(color.b)
    pixels[index + 3] = 255 // alpha channel is always 255*/
}

/* Multiply exposure, clamp pixel value, then apply gamma correction. */
function pixelProcess (value) {
    value *= exposure // apply exposure
    value = (value > 1) ? 1 : value
    value = Math.pow(value, 1 / 2.2)  // 2.2 gamma correction
    return value * 255
}
