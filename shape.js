/* Intersection structure:
 * t:        ray parameter (float), i.e. distance of intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
  constructor() {
    this.t = 0
    this.position = new THREE.Vector3()
    this.normal = new THREE.Vector3()
    this.material = null
  }
  set(isect) {
    this.t = isect.t
    this.position = isect.position
    this.normal = isect.normal
    this.material = isect.material
  }
}

/* Plane shape
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
  constructor(P0, n, material) {
    this.P0 = P0.clone()
    this.n = n.clone()
    this.n.normalize()
    this.material = material
    this.type = 0
  }
  // Given ray and range [tmin,tmax], return intersection point.
  // Return null if no intersection.
  intersect(ray, tmin, tmax) {
    let temp = this.P0.clone()
    temp.sub(ray.o) // (P0-O)
    let denom = ray.d.dot(this.n) // d.n
    if (denom == 0) { return null }
    let t = temp.dot(this.n) / denom // (P0-O).n / d.n
    if (t < tmin || t > tmax) return null // check range
    let isect = new Intersection()   // create intersection structure
    isect.t = t
    isect.position = ray.pointAt(t)
    isect.normal = this.n
    isect.material = this.material
    return isect
  }
  getBound() {
    return {
      xmin: 0, xmax: 0,
      ymin: 0, ymax: 0,
      zmin: 0, zmax: 0
    }
  }
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
  constructor(C, r, material) {
    this.C = C.clone()
    this.r = r
    this.r2 = r * r
    this.material = material
    this.type = 0
  }
  intersect(ray, tmin, tmax) {
    let O = ray.o.clone(), OC = O.sub(this.C)
    let a = 1, b = 2 * OC.dot(ray.d), c = OC.lengthSq() - this.r2

    let t = solveQuad(a, b, c, tmin, tmax)

    if (t == null) { return null }

    let isect = new Intersection()
    isect.t = t
    isect.position = ray.pointAt(t)
    isect.normal = isect.position.clone().sub(this.C).normalize()
    isect.material = this.material
    return isect
  }
  getBound() {
    return {
      xmin: this.C.x - this.r, xmax: this.C.x + this.r,
      ymin: this.C.y - this.r, ymax: this.C.y + this.r,
      zmin: this.C.z - this.r, zmax: this.C.z + this.r
    }
  }
}

function solveQuad(a, b, c, tmin, tmax) {
  // discriminant
  let d = b ** 2 - 4 * a * c

  if (d < 0) { return null }

  let t1 = (-b - Math.sqrt(d)) / (2 * a)
  let t2 = (-b + Math.sqrt(d)) / (2 * a)

  // we know that t1 < t2
  if (tmin <= t1 && t1 <= tmax) {
    return t1
  } else if (tmin <= t2 && t2 <= tmax) {
    return t2
  } else {
    return null
  }
}

class Triangle {
  /* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
   * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
  constructor(P0, P1, P2, material, n0, n1, n2) {
    this.P0 = P0.clone()
    this.P1 = P1.clone()
    this.P2 = P2.clone()
    this.material = material
    this.type = 2

    // bounding information
    this.xpos = [P0.x, P1.x, P2.x]
    this.ypos = [P0.y, P1.y, P2.y]
    this.zpos = [P0.z, P1.z, P2.z]

    this.C = new THREE.Vector3(
      getAvg(this.xpos),
      getAvg(this.ypos),
      getAvg(this.zpos),
    )

    if (n0) this.n0 = n0.clone()
    if (n1) this.n1 = n1.clone()
    if (n2) this.n2 = n2.clone()

    this.P20 = P2.clone().sub(this.P0)
    this.P21 = P2.clone().sub(this.P1)

    // if at least one vertex normal is not defined
    if (!this.n0 || !this.n1 || !this.n2) {
      this.normal = this.P20.clone().cross(this.P21).normalize()
    }
  }
  intersect(ray, tmin, tmax) {
    let P2to0 = this.P20, P2to1 = this.P21
    let P2toOrigin = this.P2.clone().sub(ray.o)

    let sol = solveLinSystem(ray.d, P2to0, P2to1, P2toOrigin)
    let t = sol[0], alpha = sol[1], beta = sol[2]

    if (alpha < 0 || beta < 0 || alpha + beta > 1) { return null }
    if (t < tmin || t > tmax) { return null }

    let gamma = 1 - alpha - beta

    let isect = new Intersection()
    isect.t = t
    isect.position = ray.pointAt(t)
    isect.material = this.material

    if (this.normal) { // already defined
      isect.normal = this.normal
    } else {
      let n = new THREE.Vector3()
      n.add(this.n0.clone().multiplyScalar(alpha))
      n.add(this.n1.clone().multiplyScalar(beta))
      n.add(this.n2.clone().multiplyScalar(gamma))
      isect.normal = n.normalize()
    }
    return isect
  }
  getBound() {
    return {
      xmin: Math.min(...this.xpos), xmax: Math.max(...this.xpos),
      ymin: Math.min(...this.ypos), ymax: Math.max(...this.ypos),
      zmin: Math.min(...this.zpos), zmax: Math.max(...this.zpos)
    }
  }
}

function solveLinSystem(d, a, b, c) {
  let M = new THREE.Matrix3()

  M.set(d.x, a.x, b.x,
    d.y, a.y, b.y,
    d.z, a.z, b.z,)

  M.getInverse(M)
  c.applyMatrix3(M)
  return [c.x, c.y, c.z]
}

function getAvg(array) {
  return array.reduce((a, b) => a + b) / array.length
}

function shapeLoadOBJ(objname, material, smoothnormal) {
  loadOBJAsMesh(objname, function (mesh) { // callback function for non-blocking load
    if (smoothnormal) mesh.computeVertexNormals()
    for (let i = 0; i < mesh.faces.length; i++) {
      let p0 = mesh.vertices[mesh.faces[i].a]
      let p1 = mesh.vertices[mesh.faces[i].b]
      let p2 = mesh.vertices[mesh.faces[i].c]
      if (smoothnormal) {
        let n0 = mesh.faces[i].vertexNormals[0]
        let n1 = mesh.faces[i].vertexNormals[1]
        let n2 = mesh.faces[i].vertexNormals[2]
        shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2))
      } else {
        shapes.push(new Triangle(p0, p1, p2, material))
      }
    }
  }, function () { }, function () { })
}

/* ========================================
 * You can define additional Shape classes,
 * as long as each implements intersect function.
 * ======================================== */
