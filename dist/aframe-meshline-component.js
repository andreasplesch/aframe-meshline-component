/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	if (typeof AFRAME === 'undefined') {
	    throw new Error('Component attempted to register before AFRAME was available.');
	}

	__webpack_require__(1);
	//var MeshLine = require( 'three.meshline' ); 

	AFRAME.registerComponent('meshline', {
	  schema: {
	    color: { default: '#000' },
	    lineWidth: { default: 10 },
	    lineWidthStyler: { default: '1' },
	    path: {
	      default: [
	        { x: -0.5, y: 0, z: 0 },
	        { x: 0.5, y: 0, z: 0 }
	      ],
	      // Deserialize path in the form of comma-separated vec3s: `0 0 0, 1 1 1, 2 0 3`.
	      parse: function (value) {
	          return (value instanceof String)  ? value.split(',').map(AFRAME.utils.coordinates.parse) : value; 
	      },
	      // Serialize array of vec3s in case someone does setAttribute('line', 'path', [...]).
	      stringify: function (data) {
	        return data.map(AFRAME.utils.coordinates.stringify).join(',');
	      }
	    },
	    // Alternative to 'path', specified as an SVG-stype path string with M,C, H, etc commands. SVG is 2d so Z is always 0.
	    svg: { 
	      type: 'string', 
	      default: ''
	    },
	    curveQuality: {
	      type:'number',
	      default:20
	    },
	    texture: {
	      type: 'map',
	      default: null
	    },
	    opacity: {
	      type: 'number',
	      default: null
	    }
	  },
	  
	  init: function () {
	    this.resolution = new THREE.Vector2 ( window.innerWidth, window.innerHeight ) ;
	    
	    var sceneEl = this.el.sceneEl;
	    sceneEl.addEventListener( 'render-target-loaded', this.do_update.bind(this) );
	    sceneEl.addEventListener( 'render-target-loaded', this.addlisteners.bind(this) );

	    this.strokeTexture = null;

	  /*
	    if (sceneEl.hasLoaded) {
	  
	      console.log('has loaded');
	      this.do_update(); //never happens ?
	  
	    } else {
	  
	      sceneEl.addEventListener('render-target-loaded', this.do_update.bind(this));
	  
	      }
	  */
	  },
	  
	  addlisteners: function () {
	  
	    //var canvas = this.el.sceneEl.canvas;
	  
	    // canvas does not fire resize events, need window
	    window.addEventListener( 'resize', this.do_update.bind (this) );
	    
	    //console.log( canvas );
	    //this.do_update() ;
	  
	  },
	  
	  do_update: function () {
	  
	    var canvas = this.el.sceneEl.canvas;
	    this.resolution.set( canvas.width,  canvas.height );
	    //console.log( this.resolution );
	    this.update();

	  },
	  
	  update: function (oldData) {
	    var data = this.data; // So we can refer to 'data' in closures; since 'this' shifts around
	    var line;
	    //cannot use canvas here because it is not created yet at init time
	    //console.log("canvas res:");
	    //console.log(this.resolution);
	    if (oldData===undefined) oldData={};

	    if (this.data.texture !== null && this.strokeTexture===null) {
	      var loader = new THREE.TextureLoader();
	      loader.load( this.data.texture, function( texture ) {
	        this.strokeTexture = texture;
	        this.update();
	      }.bind(this) );
	      return;
	    }


	    var material = new THREE.MeshLineMaterial({
	      color: new THREE.Color(this.data.color),
	      resolution: this.resolution,
	      sizeAttenuation: false,
	      lineWidth: data.lineWidth,
	      useMap: this.strokeTexture===null ? 0.0 : 1.0,
	      map: this.strokeTexture,
	      side: THREE.DoubleSide,

	      opacity: data.opacity ? data.opacity : 1,
	      transparent:  data.opacity!=null ? true : false, // Default opaccity=null so this will be false
	      depthTest: data.opacity!=null ? false : true 

	      //near: 0.1,
	      //far: 1000
	    });
	    var debug_material = new THREE.MeshBasicMaterial({ wireframe:true, color:'#ff0000'});

	    var geometry = new THREE.Geometry();
	    
	    if (this.data.svg.length>0  && "svg" in AFRAME.utils.diff (data, oldData) ) {
	      //geometry = svgPathToGeometry(svgRelativeCoordinatesToAbsolute(tokenizeSVGPathString(data.svg.trim())), {curveQuality: data.curveQuality});
	      geometry = svgPathToGeometry(tokenizeSVGPathString(data.svg.trim()), {curveQuality: data.curveQuality});
	      line = new THREE.MeshLine();
	      line.setGeometry( geometry);
	      this.el.setObject3D('mesh', new THREE.Mesh(line.geometry, debug_material));
	    } else {
	      this.data.path.forEach(function (vec3) {
	        geometry.vertices.push(
	          new THREE.Vector3(vec3.x, vec3.y, vec3.z)
	        );
	      });
	      var widthFn = new Function('p', 'return ' + this.data.lineWidthStyler);
	      //? try {var w = widthFn(0);} catch(e) {warn(e);}
	      line = new THREE.MeshLine();
	      line.setGeometry( geometry, widthFn );
	      this.el.setObject3D('mesh', new THREE.Mesh(line.geometry, material));
	    }
	  },
	  
	  remove: function () {
	    this.el.removeObject3D('mesh');
	  }
	});




	// Removes commas, adds spaces between commands and coordinates in an SVG string, and split()s it
	function tokenizeSVGPathString(str) {
	  str = str.replace(/\,/g,' ');
	  str = str.replace(/\-/g,' -');
	  str = str.replace(/[A-z]/g,' $& ');
	  str = str.replace(/\s+/g,' ').trim();
	  // Convert numeric strings to numbers here
	  var ret = [];
	  str.split(' ').forEach(function (el, i) {
	    if (isFinite(el)) {
	      ret.push(el*1);
	    } else if (/[mlhvcsqtaz]/ig.exec(el)) {
	      ret.push(el);
	    } else if (el.split('.').length>2) { // Illustrator will output coordinate pairs like 10.19.08. Who at Adobe thought this was OK?!?!?! Srsly people.
	      var three = el.split('.');
	      var midPos = three[0].length + 1 + (three[1].length / 2);
	      ret.push(el.substring(0, midPos)*1);
	      ret.push(el.substring(midPos)*1);
	    }
	  });
	  return ret;
	}

	// Converts SVG relative coordinates for "m", "c", "h" etc into absolute positions
	/*
	**  NO LONGER USED. The relative commands are treated as separate commands in the above.
	function svgRelativeCoordinatesToAbsolute(tok){
	  // We assume the SVG path starts with M x y
	  if (tok[0] !== 'M') console.error('Not sure how to handle an SVG path that does not begin with M command');
	  var basisX = tok[1];
	  var basisY = tok[2];
	  for (var i=3; i<tok.length; i++){ 
	    if (tok[i].search(/[mlhvcsqtaz]/)>=0) {
	      tok[i]=tok[i].toUpperCase(); // Change this draw command from rel to abs
	      if (tok[i]=="H" || tok[i]=="V") {

	      } else if (tok[i]=="C")
	      tok[i+1]+= basisX; tok[i+2]+= basisY; // Convert coordinate from rel to abs position
	      basisX=tok[i+1]; basisY=tok[i+2]; // Update the basis for subsequent rel coordinates
	    }
	  }
	  return tok;
	}
	*/

	function svgPathToGeometry(tok, opts){
	    var geometry = new THREE.Geometry();
	    var v = new THREE.Vector3(0,0,0);
	    var c = null;
	    var howManyCurves=0;
	    var x;
	    var p1, p2, c1, c2;

	    for (var i=0; i<tok.length; i++){
	      if (! (isFinite(tok[i]) || tok[i].search(/[mlhvcsqtaz]/i)>=0) ) {
	        console.warn("Invalid item in tokenized SVG string: tok["+i+"]=" + tok[i] +"\nComplete string:\n"+tok.join(" "));
	      }
	    }

	    for (var i=0; i<tok.length; i++){


	      // Skip over all numeric values; we only care about finding commands
	      if (isFinite(tok[i])) continue; 

	      var idxOfNextCommand = i; 
	      for (var j=i+1; j<tok.length; j++) { if (!isFinite(tok[j]))  {idxOfNextCommand=j; break; } }
	      if (idxOfNextCommand==i) idxOfNextCommand = tok.length;

	      if (tok[i]=="M"){
	        v = new THREE.Vector3(tok[i+1], tok[i+2], 0);
	        geometry.vertices.push(v.clone());
	        if (i>0) console.warn('SVG path contains M commands after the first command. This is not yet supported and these M commands will be drawn as lines.');
	      }
	      if (tok[i]=="L"){ // L commands can be followed by a number of x,y coordinate pairs
	        howManyCurves = (idxOfNextCommand - i-1)/ 2;
	        console.assert(howManyCurves==Math.floor(howManyCurves))
	        i=i+1; 
	        for (var x=0; x<howManyCurves; x++) {
	          v = new THREE.Vector3(tok[i], tok[i+1], 0);
	          geometry.vertices.push(v.clone());
	          i+=2;
	        }
	      }
	      if (tok[i]=="l"){ // L commands can be followed by a number of x,y coordinate pairs
	        howManyCurves = (idxOfNextCommand - i-1)/ 2;
	        console.assert(howManyCurves==Math.floor(howManyCurves))
	        i=i+1;
	        for (var x=0; x<howManyCurves; x++) {
	          v = new THREE.Vector3(tok[i], tok[i+1], 0);
	          geometry.vertices.push(v.clone().add(v));
	          i+=2;
	        }
	      }
	      if (tok[i]=="H") {
	        v = new THREE.Vector3(tok[i+1], v.y, 0);
	        geometry.vertices.push(v.clone());
	      }
	      if (tok[i]=="h") {
	        v = new THREE.Vector3(tok[i+1], v.y, 0).add(v);
	        geometry.vertices.push(v.clone());
	      }
	      if (tok[i]=="V") {
	        v = new THREE.Vector3(v.x, tok[i+1], 0);
	        geometry.vertices.push(v.clone());
	      }
	      if (tok[i]=="v") {
	        v = new THREE.Vector3(v.x, tok[i+1], 0).add(v);
	        geometry.vertices.push(v.clone());
	      }
	      if (tok[i]=="A"){
	        console.error("SVG arcs (A) not supported" );
	        // It's not a trivial 1:1 mapping between SVG arcs and Three.EllipseCurve.
	        // The Three object needs to be rotated to use the SVG ellipse rotation, and the SVG object specifies the arc curve
	        // endpoint in x,y coordinates whereas the Three curve wants the start and end in radians
	        /// https://threejs.org/docs/#api/extras/curves/EllipseCurve
	        // https://developer.mozilla.org/en/docs/Web/SVG/Tutorial/Paths#Arcs
	      }
	      if (tok[i]=="C") {
	        howManyCurves = (idxOfNextCommand - i-1)/ 6;
	        console.assert(howManyCurves==Math.floor(howManyCurves))
	        for (var x=0; x<howManyCurves; x++) {
	          p1 = v.clone();
	          c1 = new THREE.Vector3(tok[i+1], tok[i+2], 0);
	          c2 = new THREE.Vector3(tok[i+3], tok[i+4], 0);
	          p2 = new THREE.Vector3(tok[i+5], tok[i+6], 0);
	          c = new THREE.CubicBezierCurve3(p1, c1, c2, p2);
	          v=p2.clone();

	          geometry.vertices = geometry.vertices.concat(c.getSpacedPoints ( opts.curveQuality ));
	          //console.log("added C " + x + "/" + howManyCurves);
	          //console.log(c)
	          i+=6;
	        }
	      }
	      if (tok[i]=="c") {
	        // The "c" command can take multiple curves in sequences, hence the while loop
	        howManyCurves = (idxOfNextCommand - i-1)/ 6;
	        console.assert(howManyCurves==Math.floor(howManyCurves));
	        for (var x=0; x<howManyCurves; x++) {
	          p1 = v.clone(); // Relative coordinate
	          c1 = new THREE.Vector3(tok[i+1], tok[i+2], 0).add(v);
	          c2 = new THREE.Vector3(tok[i+3], tok[i+4], 0).add(v);
	          p2 = new THREE.Vector3(tok[i+5], tok[i+6], 0).add(v);
	          c = new THREE.CubicBezierCurve3(p1, c1, c2, p2);
	          v=p2.clone();
	          //v = p2.clone();
	          geometry.vertices = geometry.vertices.concat(c.getSpacedPoints ( opts.curveQuality ));
	          //console.log("added c " + x + "/" + howManyCurves);
	          //console.log(c);
	          i+=6;
	        }
	        /*
	                    v.clone().add(v),
	                    new THREE.Vector3(tok[i+1], tok[i+2], 0).add(v),
	                    new THREE.Vector3(tok[i+3], tok[i+4], 0).add(,
	                    new THREE.Vector3(tok[i+5], tok[i+6], 0)
	                );
	        v = new THREE.Vector3(tok[i+5], tok[i+6], 0); 
	                */
	      }
	      if (tok[i]=="S" || tok[i]=="T") {
	        console.error('SVG Simplified Beziers (S and T) commands are not currently supported');
	        // Too lazy to implement this at the moment; this is a rare command I think
	        //https://developer.mozilla.org/en/docs/Web/SVG/Tutorial/Paths#Bezier_Curves
	      }
	      if (tok[i]=="Q"){
	        howManyCurves = (idxOfNextCommand - i-1)/ 4;
	        for (var x=0; x<howManyCurves; x++) {
	          c = new THREE.QuadraticBezierCurve3(
	                      v.clone(),
	                      new THREE.Vector3(tok[i+1], tok[i+2], 0),
	                      new THREE.Vector3(tok[i+3], tok[i+4], 0)
	                  );
	          v = new THREE.Vector3(tok[i+3], tok[i+4], 0);
	          geometry.vertices = geometry.vertices.concat(c.getSpacedPoints ( opts.curveQuality ));
	          //console.log("added Q")
	          //console.log(c)
	          i+=4;
	        }
	      }
	      if (tok[i]=="q"){
	        howManyCurves = (idxOfNextCommand - i-1)/ 4;
	        for (var x=0; x<howManyCurves; x++) {
	          var p1 = v.clone();
	          var p2 = new THREE.Vector3(tok[i+1], tok[i+2], 0).add(p1);
	          var p3 = new THREE.Vector3(tok[i+3], tok[i+4], 0).add(p2);
	          v = p3.clone();

	          c = new THREE.QuadraticBezierCurve3(p1, p2, p3);
	          geometry.vertices = geometry.vertices.concat(c.getSpacedPoints ( opts.curveQuality ));
	          //console.log("added q")
	          //console.log(c)
	          i+=4;
	        }
	        /*
	        c = new THREE.QuadraticBezierCurve3(
	                    v.clone(),
	                    new THREE.Vector3(tok[i+1], tok[i+2], 0),
	                    new THREE.Vector3(tok[i+3], tok[i+4], 0)
	                );
	        v = new THREE.Vector3(tok[i+3], tok[i+4], 0);
	        */
	      }
	      if (tok[i]=="Z"){
	        // Draw line to start of path
	        geometry.vertices.push(geometry.vertices[0].clone());
	      }
	    } // foreach token
	    return geometry;
	} // function svgPathToGeometry

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	THREE.MeshLine = function() {

		this.positions = [];

		this.previous = [];
		this.next = [];
		this.side = [];
		this.width = [];
		this.indices_array = [];
		this.uvs = [];

		this.geometry = new THREE.BufferGeometry();
		
		this.widthCallback = null;

	}

	THREE.MeshLine.prototype.setGeometry = function( g, c ) {

		this.widthCallback = c;

		this.positions = [];

		if( g instanceof THREE.Geometry ) {
			for( var j = 0; j < g.vertices.length; j++ ) {
				var v = g.vertices[ j ];
				this.positions.push( v.x, v.y, v.z );
				this.positions.push( v.x, v.y, v.z );
			}
		}

		if( g instanceof THREE.BufferGeometry ) {
			// read attribute positions ?
		}

		if( g instanceof Float32Array || g instanceof Array ) {
			for( var j = 0; j < g.length; j += 3 ) {
				this.positions.push( g[ j ], g[ j + 1 ], g[ j + 2 ] );
				this.positions.push( g[ j ], g[ j + 1 ], g[ j + 2 ] );
			}
		}

		this.process();

	}

	THREE.MeshLine.prototype.compareV3 = function( a, b ) {

		var aa = a * 6;
		var ab = b * 6;
		return ( this.positions[ aa ] === this.positions[ ab ] ) && ( this.positions[ aa + 1 ] === this.positions[ ab + 1 ] ) && ( this.positions[ aa + 2 ] === this.positions[ ab + 2 ] );

	}

	THREE.MeshLine.prototype.copyV3 = function( a ) {

		var aa = a * 6;
		return [ this.positions[ aa ], this.positions[ aa + 1 ], this.positions[ aa + 2 ] ];

	}

	THREE.MeshLine.prototype.process = function() {

		var l = this.positions.length / 6;

		this.previous = [];
		this.next = [];
		this.side = [];
		this.width = [];
		this.indices_array = [];
		this.uvs = [];

		for( var j = 0; j < l; j++ ) {
			this.side.push( 1 );
			this.side.push( -1 );
		}

		var w;
		for( var j = 0; j < l; j++ ) {
			if( this.widthCallback ) w = this.widthCallback( j / ( l -1 ) );
			else w = 1;
			this.width.push( w );
			this.width.push( w );
		}

		for( var j = 0; j < l; j++ ) {
			this.uvs.push( j / ( l - 1 ), 0 );
			this.uvs.push( j / ( l - 1 ), 1 );
		}

		var v;

		if( this.compareV3( 0, l - 1 ) ){
			v = this.copyV3( l - 2 );
		} else {
			v = this.copyV3( 0 );
		}
		this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
		this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
		for( var j = 0; j < l - 1; j++ ) {
			v = this.copyV3( j );
			this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
			this.previous.push( v[ 0 ], v[ 1 ], v[ 2 ] );
		}

		for( var j = 1; j < l; j++ ) {	
			v = this.copyV3( j );
			this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
			this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
		}

		if( this.compareV3( l - 1, 0 ) ){
			v = this.copyV3( 1 );
		} else {
			v = this.copyV3( l - 1 );
		}
		this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );
		this.next.push( v[ 0 ], v[ 1 ], v[ 2 ] );

		for( var j = 0; j < l - 1; j++ ) {
			var n = j * 2;
			this.indices_array.push( n, n + 1, n + 2 );
			this.indices_array.push( n + 2, n + 1, n + 3 );
		}

		if (!this.attributes) {
			this.attributes = {
				position: new THREE.BufferAttribute( new Float32Array( this.positions ), 3 ),
				previous: new THREE.BufferAttribute( new Float32Array( this.previous ), 3 ),
				next: new THREE.BufferAttribute( new Float32Array( this.next ), 3 ),
				side: new THREE.BufferAttribute( new Float32Array( this.side ), 1 ),
				width: new THREE.BufferAttribute( new Float32Array( this.width ), 1 ),
				uv: new THREE.BufferAttribute( new Float32Array( this.uvs ), 2 ),
				index: new THREE.BufferAttribute( new Uint16Array( this.indices_array ), 1 )
			}
		} else {
			this.attributes.position.copyArray(new Float32Array(this.positions));
			this.attributes.position.needsUpdate = true;
			this.attributes.previous.copyArray(new Float32Array(this.previous));
			this.attributes.previous.needsUpdate = true;
			this.attributes.next.copyArray(new Float32Array(this.next));
			this.attributes.next.needsUpdate = true;
			this.attributes.side.copyArray(new Float32Array(this.side));
			this.attributes.side.needsUpdate = true;
			this.attributes.width.copyArray(new Float32Array(this.width));
			this.attributes.width.needsUpdate = true;
			this.attributes.uv.copyArray(new Float32Array(this.uvs));
			this.attributes.uv.needsUpdate = true;
			this.attributes.index.copyArray(new Uint16Array(this.index));
			this.attributes.index.needsUpdate = true;
		}

		this.geometry.addAttribute( 'position', this.attributes.position );
		this.geometry.addAttribute( 'previous', this.attributes.previous );
		this.geometry.addAttribute( 'next', this.attributes.next );
		this.geometry.addAttribute( 'side', this.attributes.side );
		this.geometry.addAttribute( 'width', this.attributes.width );
		this.geometry.addAttribute( 'uv', this.attributes.uv );

		this.geometry.setIndex( this.attributes.index );

	}

	THREE.MeshLineMaterial = function ( parameters ) {

		var vertexShaderSource = [
	'precision highp float;',
	'',
	'attribute vec3 position;',
	'attribute vec3 previous;',
	'attribute vec3 next;',
	'attribute float side;',
	'attribute float width;',
	'attribute vec2 uv;',
	'',
	'uniform mat4 projectionMatrix;',
	'uniform mat4 modelViewMatrix;',
	'uniform vec2 resolution;',
	'uniform float lineWidth;',
	'uniform vec3 color;',
	'uniform float opacity;',
	'uniform float near;',
	'uniform float far;',
	'uniform float sizeAttenuation;',
	'',
	'varying vec2 vUV;',
	'varying vec4 vColor;',
	//'varying vec3 vPosition;',
	'',
	'vec2 fix( vec4 i, float aspect ) {',
	'',
	'    vec2 res = i.xy / i.w;',
	'    res.x *= aspect;',
	'    return res;',
	'',
	'}',
	'',
	'void main() {',
	'',
	'    float aspect = resolution.x / resolution.y;',
	'	 float pixelWidthRatio = 1. / (resolution.x * projectionMatrix[0][0]);',
	'',
	'    vColor = vec4( color, opacity );',
	'    vUV = uv;',
	'',
	'    mat4 m = projectionMatrix * modelViewMatrix;',
	'    vec4 finalPosition = m * vec4( position, 1.0 );',
	'    vec4 prevPos = m * vec4( previous, 1.0 );',
	'    vec4 nextPos = m * vec4( next, 1.0 );',
	'',
	'    vec2 currentP = fix( finalPosition, aspect );',
	'    vec2 prevP = fix( prevPos, aspect );',
	'    vec2 nextP = fix( nextPos, aspect );',
	'',
	'	 float pixelWidth = finalPosition.w * pixelWidthRatio;',
	'    float w = 1.8 * pixelWidth * lineWidth * width;',
	'',
	'    if( sizeAttenuation == 1. ) {',
	'        w = 1.8 * lineWidth * width;',
	'    }',
	'',
	'    vec2 dir;',
	'    if( nextP == currentP ) dir = normalize( currentP - prevP );',
	'    else if( prevP == currentP ) dir = normalize( nextP - currentP );',
	'    else {',
	'        vec2 dir1 = normalize( currentP - prevP );',
	'        vec2 dir2 = normalize( nextP - currentP );',
	'        dir = normalize( dir1 + dir2 );',
	'',
	'        vec2 perp = vec2( -dir1.y, dir1.x );',
	'        vec2 miter = vec2( -dir.y, dir.x );',
	'        //w = clamp( w / dot( miter, perp ), 0., 4. * lineWidth * width );',
	'',
	'    }',
	'',
	'    //vec2 normal = ( cross( vec3( dir, 0. ), vec3( 0., 0., 1. ) ) ).xy;',
	'    vec2 normal = vec2( -dir.y, dir.x );',
	'    normal.x /= aspect;',
	'    normal *= .5 * w;',
	'',
	'    vec4 offset = vec4( normal * side, 0.0, 1.0 );',
	'    finalPosition.xy += offset.xy;',
	'',
	//'	 vPosition = ( modelViewMatrix * vec4( position, 1. ) ).xyz;',
	'    gl_Position = finalPosition;',
	'',
	'}' ];

		var fragmentShaderSource = [
			'#extension GL_OES_standard_derivatives : enable',
	'precision mediump float;',
	'',
	'uniform sampler2D map;',
	'uniform float useMap;',
	'uniform float useDash;',
	'uniform vec2 dashArray;',
	'',
	'varying vec2 vUV;',
	'varying vec4 vColor;',
	//'varying vec3 vPosition;',
	'',
	'void main() {',
	'',
	'    vec4 c = vColor;',
	'    if( useMap == 1. ) c *= texture2D( map, vUV );',
	'	 if( useDash == 1. ){',
	'	 	 ',
	'	 }',
	'    gl_FragColor = c;',
	'',   
	'}' ];

		function check( v, d ) {
			if( v === undefined ) return d;
			return v;
		}

		THREE.Material.call( this );

		parameters = parameters || {};

		this.lineWidth = check( parameters.lineWidth, 1 );
		this.map = check( parameters.map, null );
		this.useMap = check( parameters.useMap, 0 );
		this.color = check( parameters.color, new THREE.Color( 0xffffff ) );
		this.opacity = check( parameters.opacity, 1 );
		this.resolution = check( parameters.resolution, new THREE.Vector2( 1, 1 ) );
		this.sizeAttenuation = check( parameters.sizeAttenuation, 1 );
		this.near = check( parameters.near, 1 );
		this.far = check( parameters.far, 1 );
		this.dashArray = check( parameters.dashArray, [] );
		this.useDash = ( this.dashArray !== [] ) ? 1 : 0;

		var material = new THREE.RawShaderMaterial( { 
			uniforms:{
				lineWidth: { type: 'f', value: this.lineWidth },
				map: { type: 't', value: this.map },
				useMap: { type: 'f', value: this.useMap },
				color: { type: 'c', value: this.color },
				opacity: { type: 'f', value: this.opacity },
				resolution: { type: 'v2', value: this.resolution },
				sizeAttenuation: { type: 'f', value: this.sizeAttenuation },
				near: { type: 'f', value: this.near },
				far: { type: 'f', value: this.far },
				dashArray: { type: 'v2', value: new THREE.Vector2( this.dashArray[ 0 ], this.dashArray[ 1 ] ) },
				useDash: { type: 'f', value: this.useDash }
			},
			vertexShader: vertexShaderSource.join( '\r\n' ),
			fragmentShader: fragmentShaderSource.join( '\r\n' )
		});

		delete parameters.lineWidth;
		delete parameters.map;
		delete parameters.useMap;
		delete parameters.color;
		delete parameters.opacity;
		delete parameters.resolution;
		delete parameters.sizeAttenuation;
		delete parameters.near;
		delete parameters.far;
		delete parameters.dashArray;

		material.type = 'MeshLineMaterial';

		material.setValues( parameters );

		return material;

	};

	THREE.MeshLineMaterial.prototype = Object.create( THREE.Material.prototype );
	THREE.MeshLineMaterial.prototype.constructor = THREE.MeshLineMaterial;

	THREE.MeshLineMaterial.prototype.copy = function ( source ) {

		THREE.Material.prototype.copy.call( this, source );

		this.lineWidth = source.lineWidth;
		this.map = source.map;
		this.useMap = source.useMap;
		this.color.copy( source.color );
		this.opacity = source.opacity;
		this.resolution.copy( source.resolution );
		this.sizeAttenuation = source.sizeAttenuation;
		this.near = source.near;
		this.far = source.far;

		return this;

	};


/***/ })
/******/ ]);