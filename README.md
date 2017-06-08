## aframe-meshline-component

A component for thick lines in [A-Frame](https://aframe.io).

The component is based on the A-frame component tutorial and [THREE.MeshLine](https://github.com/spite/THREE.MeshLine). It adds support for SVG-style paths by interpolating SVG curves into 

Here is the adapted [smiley face example](http://andreasplesch.github.io/aframe-meshline-component/basic/index.html)

TODO:
- README
- test?
- awesome?
- Support SVG A, T, and S commands (especially A!)

### Properties

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
|    path      |    line coordinates         |    -0.5 0 0, 0.5 0 0           |
|    svg      |    SVG path string         |    null           |
| lineWidth | width of line in px | 10 |
| opacity | Line opacity. Set this to 1 if you're using a texture with transparency | null (no opacity) |
| texture | Filename or AFrame asset id to use as texture for path | null |
| curveQuality | How many line segments to interpolate SVG curves into  | 20 | 
| lineWidthStyler | width(p) function. No effect on SVG paths. | 1 |
| color | line color | #000 |

### Usage

#### Properties

The path, lineWidth and color properties do what you would expect. The lineWidthStyler property needs an explanation, however.

##### lineWidthStyler

The lineWidthStyler property allows for defining the line width as a function of relative position p along the path of the line. By default it is set to a constant 1. The final, rendered width is scaled by lineWidth. You can use p in your function definition. It varies from 0 at the first vertex of the path to 1 at the last vertex of the path. Here are some examples:

| lineWidthStyler value | effect |
| --------------------- | ------ |
| p | taper from nothing to lineWidth at the end |
| 1 - p | taper from lineWidth to nothing at the end |
| 1 - Math.abs(2 * p - 1) | taper to lineWidth at the center from both sides |
| Math.sin( p * 3.1415 ) | smoothly bulge to lineWidth at the center from both sides |
| 0.5 + 0.5 * Math.sin( (p - 0.5) * 2 * 3.1415 * 10 ) | full wave every 10 vertices with lineWidth amplitude |

Use only one expression, and only 'p' as a variable.

Technically, the provided function string is the return argument of a constructed function. It is therefore possible to intentionally do something like 'THREE = null' which will break the scene. As a scene designer, it is thus necessary to be careful about exposing this property to page visitors.
 

### SVG Paths

There is limited support for SVG paths. The "M", "L", "H", "V", "C", and "Q", and "Z" commands are supported, along with their lower case (relative coordinates) counterparts. The "A" (ellipse/circle), and "T" and "S" curve shorthand commands are currently not implemented. 

The SVG Bezier curves (C and Q commands) are interpolated into `curveQuality` linear segments. 



#### Browser Installation

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.5.0/aframe.min.js"></script>
  <script src="https://rawgit.com/andreasplesch/aframe-meshline-component/master/dist/aframe-meshline-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity meshline="lineWidth: 20; path: -2 -1 0, 0 -2 0, 2 -1; color: #E20049"></a-entity>
    <a-entity meshline="lineWidth: 5; svg: M0,1.8 c0.94,0, 1.4 -0.24, 2.7 -0.2,        1.9,0,3.0,1.2,7.7,1.0,0.067,0,0.3,0,0.57,0; color: #ff0000"></a-entity>
  </a-scene>
</body>
```

#### NPM Installation

Install via NPM:

```bash
npm install aframe-meshline-component
```

Then register and use.

```js
require('aframe');
require('aframe-meshline-component');
```
