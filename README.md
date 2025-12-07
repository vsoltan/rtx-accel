# rtx-accel
Bounding Volume Hierarchy (BVH) Acceleration Structure For A Simple Raytracer

## To Run
Since recent browser updates prohibit local file access, scenes that have geometry defined outside of JavaScript (obj files) must be run using a local server.
```
cd rtx-accel
python3 -m http.server 8000
```
Then, in a browser open
```
http://localhost:8000/scenes/
```
and select a scene to render.

NOTE: There are also extensions that can streamline this process
https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer

# Toggling Acceleration On and Off
To observe the performance uplift, you can open any `.html` file in the `scenes` folder. Toggling the `accel` option enables/disables acceleration structures.

```html
<script>
  let accel = true  
</script>
```


