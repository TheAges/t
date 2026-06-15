// SITE_ROOT is defined as a global in the page's <head> (inline <script>).

//Global variables for changing colors
let is_WebGL_Available = false;

let colorBG = new THREE.Vector3(1.0,1.0,1.0)
let colorLINES = new THREE.Vector3(0.6,0.6,0.6)

let mainBgColor = new THREE.Vector3(255,255,255)
let mainAccentColor = new THREE.Vector3(0,0,0)

let colorTransitionSpeed = 1400;


// Wait for canvnas container to exist:
const isElementLoaded = async selector => {
    while ( document.querySelector(selector) === null) {
      await new Promise( resolve =>  requestAnimationFrame(resolve) )
    }
    return document.querySelector(selector);
  };

  
//Check is WebGL is available (check only once because otherwise it keep creating stuff)
if ( webgl_support() ) { is_WebGL_Available = true; }
else { is_WebGL_Available = false; };

if ( is_WebGL_Available ) {
  //check for a specific class .file-item and then running code.
  isElementLoaded('#background-canvas').then((selector) => {
    mainThree();
  });
  
} 
else {
  console.log('%c ERROR: WebGL is not available', 'color: red');

  isElementLoaded('#background-canvas').then((selector) => {
    document.getElementById("background-canvas").style.width = "100vw";
    document.getElementById("background-canvas").style.height = "100vh";

    //document.getElementById("background-canvas").style.backgroundImage = "url('res/Images/zz.BGs/" + Math.floor(Math.random() * 9) + ".png')";
    document.getElementById("background-canvas").innerHTML = '<object id="svgBG_Wrapper" data="' + SITE_ROOT + 'res/Images/zz.BGs/0.svg" type="image/svg+xml"><img src="' + SITE_ROOT + 'res/Images/zz.BGs/0.png" /></object>';

    //document.getElementById("background-canvas").innerHTML = '<svg viewBox="0 0 100 100" class="icon shape-codepen"><use xlink:href="res/Images/zz.BGs/0.png"></use></svg>';


    //document.getElementById("background-canvas").firstChild.getSVGDocument().rootElement.viewBox.baseVal.x = Math.floor(Math.random() * 4000);
    
    document.getElementById("background-canvas").style.backgroundPosition = "center";
    document.getElementById("background-canvas").style.backgroundRepeat = "no-repeat";
    document.getElementById("background-canvas").style.backgroundSize = "3000px 3000px";

    document.getElementById("background-canvas").style.backgroundColor = "#ffffff";

    TWEEN_LOOP();
  });
}

function webgl_support() { 
  try {
   var canvas = document.createElement('canvas'); 
   return !!window.WebGLRenderingContext &&
     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch(e) {
    return false;
  }
};

//SET TWEEN PROPERTY FOR CHANGING BG COLORS

//let tweenBGColor = new TWEEN.Tween(colorBG)
//.to( {x: newColor.x, y: newColor.y, z: newColor.z}, colorTransitionSpeed)
//.yoyo(true)
//.repeat(Infinity)
//.easing(TWEEN.Easing.Cubic.InOut)
//.onUpdate(() => {
//  changeBgColor( newColor.x, newColor.y, newColor.z);
//})
//.start()
//;

let tweenBGColor = new TWEEN.Tween(colorBG).easing(TWEEN.Easing.Cubic.InOut);
let tweenBgLineColor = new TWEEN.Tween(colorLINES).easing(TWEEN.Easing.Cubic.InOut);

let tween_mainAccentColor = new TWEEN.Tween(mainAccentColor)
  .easing(TWEEN.Easing.Cubic.InOut)
  .onUpdate(function (object) { 
    document.querySelector(':root').style.setProperty('--main-accent-color',  'rgb(' + mainAccentColor.x + ',' + mainAccentColor.y + ',' + mainAccentColor.z + ')'); 
  });

let tween_mainBgColor = new TWEEN.Tween(mainBgColor)
  .easing(TWEEN.Easing.Cubic.InOut)
  .onUpdate(function (object) { 
    document.querySelector(':root').style.setProperty('--main-bg-color',  'rgb(' + mainBgColor.x + ',' + mainBgColor.y + ',' + mainBgColor.z + ')'); 
  });


function changeBgColor(color) { 

  if ( !checkColorHEX(color) ) { return };
  
  //Convert the string color from hex to dec (it start from 1 becouse the first element of string is #)
  let r = parseInt(color.substr(1, 2),16);
  let g = parseInt(color.substr(3, 2),16);
  let b = parseInt(color.substr(5, 2),16);

  //Change interface values
  tween_mainBgColor.stop();
  tween_mainBgColor.to( {x: r, y: g, z: b}, colorTransitionSpeed);
  tween_mainBgColor.start(undefined, true);

  //Change background values (three.js or svg internal style)
  if (is_WebGL_Available) {
    tweenBGColor.stop();
    tweenBGColor.to( {x: r/255, y: g/255, z: b/255}, colorTransitionSpeed);
    tweenBGColor.start(undefined, true);
  }
  else {
    //This is animated through an transition propetiy on the CSS
    document.getElementById("background-canvas").style.backgroundColor = color;
  };

};

//Change all svgs color lines

function changeBgLineColor(color) {

  if ( !checkColorHEX(color) ) { return };

  //Convert the string color from hex to dec (it start from 1 becouse the first element of string is #)
  let r = parseInt(color.substr(1, 2),16);
  let g = parseInt(color.substr(3, 2),16);
  let b = parseInt(color.substr(5, 2),16);

  //Change background values (three.js or svg internal style)
  if (is_WebGL_Available) {
    tweenBgLineColor.stop();
    tweenBgLineColor.to( {x: r/255, y: g/255, z: b/255}, colorTransitionSpeed);
    tweenBgLineColor.start(undefined, true);
  }
  else {
    //This is animated through an transition propetiy on the interal CSS of the SVG
    document.getElementById("svgBG_Wrapper").contentDocument.getElementById("svg_document").style.stroke = color;
  };

};

function changeAccentColor(color) {

  if ( !checkColorHEX(color) ) { return };

  //Convert the string color from hex to dec (it start from 1 becouse the first element of string is #)
  let r = parseInt(color.substr(1, 2),16);
  let g = parseInt(color.substr(3, 2),16);
  let b = parseInt(color.substr(5, 2),16);
  
  //Change interface values
  tween_mainAccentColor.stop();
  tween_mainAccentColor.to( {x: r, y: g, z: b}, colorTransitionSpeed);
  tween_mainAccentColor.start(undefined, true);

};


function checkColorHEX(string) {
  var reg=/^#[0-9A-F]{6}$/i;

  if (reg.test(string)) {return true}
  else {console.log("Wrong input color format, it shuold be a hex with this format: #RRGGBB"); return false}

}

/*
function changeSVGlinesColor(color) {
  svgDocument = document.getElementById("svgBG_Wrapper").contentDocument;
  //svgDocument = document.getElementById("svgBG").getSVGDocument();

  lines = svgDocument.getElementsByClassName("st0");

  for (let i = 0; i < lines.length; i++) {
    lines[i].style.stroke = color;
  }
}
*/



// Main Three.js code:

function mainThree() {
    const container = document.getElementById("background-canvas");
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(renderer.domElement);

    const uniforms = {
    iResolution: { value: new THREE.Vector2() },
    iTime: { value: 0.0 },
    presudoHash: { value: Math.round((Math.random()*990)+10) },
    colorBG: { value: colorBG },
    colorLINES: { value: colorLINES },
    };

    const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: "",
    fragmentShader: "",
    });

    const planeGeometry = new THREE.PlaneBufferGeometry(2, 2);
    const planeMesh = new THREE.Mesh(planeGeometry, material);
    scene.add(planeMesh);

    function resizeRenderer() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.aspect = width / height;

    const planeScale = Math.max(width / height, 1);
    planeMesh.scale.set(planeScale, 1, 1);

    camera.updateProjectionMatrix();
    uniforms.iResolution.value.x = width;
    uniforms.iResolution.value.y = height;
    }

    window.addEventListener("resize", resizeRenderer);
    resizeRenderer();

    camera.position.z = 1;

    // Load vertex shader
    const vertexShaderFile = SITE_ROOT + "js/shaders/vertexShader.glsl";
    fetch(vertexShaderFile)
    .then((response) => response.text())
    .then((vertexShader) => {
        material.vertexShader = vertexShader;
        material.needsUpdate = true;
        checkShaderLoadingComplete();
    });

    // Load fragment shader
    const fragmentShaderFile = SITE_ROOT + "js/shaders/fragmentShader.glsl";
    fetch(fragmentShaderFile)
    .then((response) => response.text())
    .then((fragmentShader) => {
        material.fragmentShader = fragmentShader;
        material.needsUpdate = true;
        material.extensions.derivatives = true; //Enable derivates extension for this shader
        checkShaderLoadingComplete();
    });

    let shadersLoaded = 0;
    function checkShaderLoadingComplete() {
    shadersLoaded++;
    if (shadersLoaded === 2) {
        startAnimation();
    }
    }

    function startAnimation() {
    function animate() {
        requestAnimationFrame(animate);
      
        uniforms.iTime.value += 0.01;

        renderer.render(scene, camera);

        

        TWEEN.update();
    }

    animate();
    }
}

function TWEEN_LOOP () {
  	// Setup the animation loop.
	function animate(time) {
		tween_mainAccentColor.update(time)
    tweenBgLineColor.update(time)
		requestAnimationFrame(animate)
	}
	requestAnimationFrame(animate)
}
