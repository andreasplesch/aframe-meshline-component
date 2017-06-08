if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

require('./lib/THREE.MeshLine');

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
        return value.split(',').map(AFRAME.utils.coordinates.parse);
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
    curveQuality: { type:'number', default:200}
  },
  
  init: function () {
    this.resolution = new THREE.Vector2 ( window.innerWidth, window.innerHeight ) ;
    
    var sceneEl = this.el.sceneEl;
    sceneEl.addEventListener( 'render-target-loaded', this.do_update.bind(this) );
    sceneEl.addEventListener( 'render-target-loaded', this.addlisteners.bind(this) );
  
    
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
  
  update: function () {
    var data = this.data; // So we can refer to 'data' in closures; since 'this' shifts around
    //cannot use canvas here because it is not created yet at init time
    //console.log("canvas res:");
    //console.log(this.resolution);
    var material = new THREE.MeshLineMaterial({
      color: new THREE.Color(this.data.color),
      resolution: this.resolution,
      sizeAttenuation: false,
      lineWidth: this.data.lineWidth,
      //near: 0.1,
      //far: 1000
    });
  
    var geometry = new THREE.Geometry();
    
    if (this.data.svg.length>0 ) {
    } else {
      this.data.path.forEach(function (vec3) {
        geometry.vertices.push(
          new THREE.Vector3(vec3.x, vec3.y, vec3.z)
        );
      });
    }
    
    var widthFn = function(p){return data.lineWidthStyle; }; // new Function ('p', 'return ' + this.data.lineWidthStyler);
    //? try {var w = widthFn(0);} catch(e) {warn(e);}
    var line = new THREE.MeshLine();
    line.setGeometry( geometry, widthFn );
    this.el.setObject3D('mesh', new THREE.Mesh(line.geometry, material));
  },
  
  remove: function () {
    this.el.removeObject3D('mesh');
  }
});




// Removes commas, adds spaces between commands and coordinates in an SVG string, and split()s it
function tokenizeSVGPathString(str) {
  str = str.replace(/\,/g,' ');
  str = str.replace(/\-/g,' ');
  str = str.replace(/[A-z]/g,/( $& )/);
  str = str.replace(/\s+/,' ').trim();
  return str.split(' ');
}

// Converts SVG relative coordinates for "m", "c", "h" etc into absolute positions
function svgRelativeCoordinatesToAbsolute(tok){
  // We assume the SVG path starts with M x y
  if (t[0] !== 'M') console.error('Not sure how to handle an SVG path that does not begin with M command');
  var basisX = t[1];
  var basisY = t[2];
  for (var i=3; i<tok.length; i++){
    if (tok[i].test(/[mlhvcsqtaz]/)) {
      tok[i]=tok[i].toUpperCase(); // Change this draw command from rel to abs
      tok[i+1]+= basisX; tok[i+2]+= basisY; // Convert coordinate from rel to abs position
      basisX=tok[i+1]; basisY=tok[i+2]; // Update the basis for subsequent rel coordinates
    }
  }
  return tok;
}


function svgPathToGeometry(tok, opts){
    var geometry = new THREE.Geometry();
    var v = new THREE.Vector3(0,0,0);
    var c = null;

    for (var i=0; i<tok.length; i++){
      if (tok[i]=="M"){
        v = new THREE.Vector3(tok[i+1], tok[i+2], 0);
        geometry.vertices.push(v.clone());
        if (i>0) console.warn('SVG path contains M commands after the first command. This is not yet supported and these M commands will be drawn as lines.');
      }
      if (tok[i]=="L"){ // L commands can be followed by a number of x,y coordinate pairs
        for (var j=(i+1); j<tok.length; j+=2){
          if (!isFiniti(tok[j])) break; 
          v = new THREE.Vector3(tok[j], tok[j+1], 0);
          geometry.vertices.push(v.clone());
        }
      }
      if (tok[i]=="H") {
        v = new THREE.Vector3(tok[i+1], v.y, 0);
        geometry.vertices.push(v.clone());
      }
      if (tok[i]=="V") {
        v = new THREE.Vector3(v.x, tok[i+1], 0);
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
        c = new THREE.CubicBezierCurve3(
                    v.clone(),
                    new THREE.Vector3(tok[i+1], tok[i+2], 0),
                    new THREE.Vector3(tok[i+3], tok[i+4], 0),
                    new THREE.Vector3(tok[i+5], tok[i+6], 0)
                );
        v = new THREE.Vector3(tok[i+5], tok[i+6], 0); 
        geometry.vertices.push(c.getSpacedPoints ( opts.curveQuality ));
      }
      if (tok[i]=="S" || tok[i]=="T") {
        console.error('SVG Simplified Beziers (S and T) commands are not currently supported');
        // Too lazy to implement this at the moment; this is a rare command I think
        //https://developer.mozilla.org/en/docs/Web/SVG/Tutorial/Paths#Bezier_Curves
      }
      if (tok[i]=="Q"){
        c = new THREE.QuadraticBezierCurve3(
                    v.clone(),
                    new THREE.Vector3(tok[i+1], tok[i+2], 0),
                    new THREE.Vector3(tok[i+3], tok[i+4], 0)
                );
        v = new THREE.Vector3(tok[i+3], tok[i+4], 0);
        geometry.vertices.push(c.getSpacedPoints ( opts.curveQuality ));
      }
      if (tok[i]=="Z"){
        // Draw line to start of path
        geometry.vertices.push(geometry.vertices[0].clone());
      }
    }

}