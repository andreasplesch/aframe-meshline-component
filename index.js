if (typeof AFRAME === 'undefined') {
    throw new Error('Component attempted to register before AFRAME was available.');
}

require('./lib/THREE.MeshLine');
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