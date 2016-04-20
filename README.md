## aframe-meshline-component

A component for thick lines in [A-Frame](https://aframe.io).

The component is based on the A-frame component tutorial.

Here is the adapted [smiley face example](http://andreasplesch.github.io/aframe-pages/components/meshline)

TODO:
- README
- test?
- awesome?

### Properties

| Property | Description | Default Value |
| -------- | ----------- | ------------- |
|    path      |    line coordinates         |    -0.5 0 0, 0.5 0 0           |
| lineWidth | width of line in px | 10 |
| color | line color | #000 |

### Usage

#### Browser Installation

Install and use by directly including the [browser files](dist):

```html
<head>
  <title>My A-Frame Scene</title>
  <script src="https://aframe.io/releases/0.2.0/aframe.min.js"></script>
  <script src="https://rawgit.com/andreasplesch/aframe-meshline-component/master/dist/aframe-meshline-component.min.js"></script>
</head>

<body>
  <a-scene>
    <a-entity meshline="lineWidth: 20; path: -2 -1 0, 0 -2 0, 2 -1; color: #E20049"></a-entity>
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
