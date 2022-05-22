
// destination vector for intersectBox method
let isectP = new THREE.Vector3(0, 0, 0)

class BoundingBox {
  constructor (min, max, objs) {
    this.min = min
    this.max = max
    this.box = new THREE.Box3(min, max)
    this.objs = objs // objects contained within the box
  }
  intersect (ray) {
    let raytrace = new THREE.Ray(ray.o, ray.d)
    if (!raytrace.intersectBox(this.box, isectP)) { return false }
    return true
  }
}

class BoundingVolumeNode {
  constructor (boundingBox, level) {
    this.boundingBox = boundingBox
    this.level = level
    this.left = null
    this.right = null
  }
  hasChild () {
    return this.left || this.right
  }
  intersectsWith (ray) {
    return this.boundingBox.intersect(ray)
  }
  getIntersection (ray) {
    if (this.intersectsWith(ray)) {
      if (this.hasChild()) {
        let L = [], R = []
        if (this.left) { L = this.left.getIntersection(ray) }
        if (this.right) { R = this.right.getIntersection(ray) }
        return L.concat(R)
      } else { return this.boundingBox.objs }
    } else { return [] }
  }
}

function constructBVHTree (objs, level) {
  if (objs.length == 0) {
    console.log('shape struct did not load properly')
    return null
  }
  if (objs.length == 1) { // create a leaf node
    return new BoundingVolumeNode(createBoundFor(objs), level)
  }

  let bound = createBoundFor(objs)
  let axis = getMaxAxis(bound)
  let partition = getPartition(objs, axis)

  let root = new BoundingVolumeNode(bound, level)
  root.left = constructBVHTree(partition.lobjs, level + 1)
  root.right = constructBVHTree(partition.robjs, level + 1)
  return root
}

function getPartition (objs, axis) {
  sortAlongAxis(objs, axis)
  let split = Math.floor((objs.length + 1) / 2)

  let leftObj = objs.slice(0, split)
  let rightObj = objs.slice(split, objs.length)
  return { lobjs: leftObj, robjs: rightObj }
}

function createBoundFor (objs) {
  let min = new THREE.Vector3(Infinity, Infinity, Infinity)
  let max = new THREE.Vector3(-Infinity, -Infinity, -Infinity)

  for (let i = 0; i < objs.length; i++) {
    let bound = objs[i].getBound()
    minVector(min, bound)
    maxVector(max, bound)
  }
  return new BoundingBox(min, max, objs)
}

// HELPER FUNCTIONS

function getMaxAxis (boundingBox) {
  let min = Object.values(boundingBox.min)
  let max = Object.values(boundingBox.max)
  let lengths = difference(max, min)
  return indexOfMax(lengths)
}

function indexOfMax (array) {
  if (array.length == 0) { return -1 }
  let index = 0
  let maxValue = array[0]

  for (let i = 1; i < array.length; i++) {
    if (array[i] > maxValue) {
      maxValue = array[i]
      index = i
    }
  }
  return index
}

// subtract the values of two arrays
function difference (u, w) { return u.map((a, i) => a - w[i]) }

function sortAlongAxis (objs, axis) {
  switch (axis) {
    case 0:
      return objs.sort((a, b) => a.C.x - b.C.x)
      break
    case 1:
      return objs.sort((a, b) => a.C.y - b.C.y)
      break
    case 2:
      return objs.sort((a, b) => a.C.z - b.C.z)
      break
    default:
      console.log('undefined axis')
  }
}

function minVector (min, v) {
  if (v.xmin < min.x) { min.x = v.xmin }
  if (v.ymin < min.y) { min.y = v.ymin }
  if (v.zmin < min.z) { min.z = v.zmin }
}

function maxVector (max, v) {
  if (v.xmax > max.x) { max.x = v.xmax }
  if (v.ymax > max.y) { max.y = v.ymax }
  if (v.zmax > max.z) { max.z = v.zmax }
}

// TESTING

function getBoundingBox (shape) {
  let bounds = shape.getBound()
  let min = new THREE.Vector3(bounds.xmin, bounds.ymin, bounds.zmin)
  let max = new THREE.Vector3(bounds.xmax, bounds.ymax, bounds.zmax)
  return new BoundingBox(min, max, [shape])
}

function getIndivBounds (obj) {
  bounds = []
  for (let i = 0; i < obj.length; i++) {
    bounds.push(getBoundingBox(obj[i]))
  }
  return bounds
}
