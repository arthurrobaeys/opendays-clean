// standard global variables
var container, scene, camera, renderer, controls, stats;
var keyboard = new THREEx.KeyboardState();

// custom global variables
var video,
  videoImage,
  videoImageBg,
  videoImageContext,
  videoTexture,
  card,
  cardGeo,
  floorTexture,
  bgTexture,
  cardMaterial,
  cardCamera,
  cardPosition,
  cloudGeo,
  cloudMaterial;
var rotation = true,
  playing = false;
let cardFocus = false;
let lastClicked = null;
let RESOURCES_LOADED = false;
let LOADING_MANAGER = null;
var SCREEN_WIDTH = window.innerWidth,
  SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45,
  ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
  NEAR = 0.1,
  FAR = 5000;
const labelMusic = document.querySelector('.mute-label');

// loading screen
const loadingScreen = document.querySelector('.loadingScreen');
const continueBtn = document.querySelector('.continue-btn');

//vars for carrousel
let numOfCards = 30;
let carrousel = new THREE.Group();
let carrouselRadius = 630;
let isAnimating = false;

const radianInterval = (2 * Math.PI) / numOfCards;
const centerPoint = { x: 0, y: 100, z: 0 };

init();
animate();

// FUNCTIONS
function init() {
  loadingManager = new THREE.LoadingManager();

  const loadBar = document.querySelector('.loading');

  loadingManager.onProgress = function (item, loaded, total) {
    loadBar.style.width = (loaded / total) * 30 + '%';
  };

  loadingManager.onLoad = function () {
    RESOURCES_LOADED = true;
    continueBtn.style.display = 'block';
    continueBtn.addEventListener('click', setDisplayNone);
  };

  const setDisplayNone = async (e) => {
    await fadeOut();
  };

  const fadeOut = async () => {
    loadingScreen.classList.add('fade-out');
    await setTimeout(function () {
      loadingScreen.style.display = 'none';
    }, 1000);
  };

  //UI INTERACTION
  const mute = document.querySelector('.mute-btn');
  const muteLabel = document.querySelector('.mute-label');
  mute.addEventListener('click', function muteVideo(event) {
    if (video.muted === true) {
      video.muted = false;
      mute.src = 'Three.js/images/music-on.svg';
      muteLabel.textContent = 'Music on';
    } else {
      video.muted = true;
      mute.classList.remove('muted');
      mute.src = 'Three.js/images/music-off.svg';
      muteLabel.textContent = 'Music off';
    }
  });

  window.addEventListener('resize', function () {
    let width = window.innerWidth;
    if (width < 550) {
      labelMusic.style.display = 'none';
    } else if (width >= 550) {
      labelMusic.style.display = 'block';
    }
  });

  let loader = new THREE.TextureLoader(loadingManager);

  // SCENE
  scene = new THREE.Scene();
  // CAMERAS
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);

  // RENDERER
  if (Detector.webgl) {
    console.log('webgl renderer active');
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } else {
    console.log('no webgl renderer, switching to canvasrenderer');
    renderer = new THREE.CanvasRenderer();
  }
  var domEvents = new THREEx.DomEvents(camera, renderer.domElement);

  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  //renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.physicallyCorrectLights;

  //PIXELRATIO
  if (SCREEN_WIDTH < 550) {
    labelMusic.style.display = 'none';
    renderer.setPixelRatio(2);
  } else if (SCREEN_WIDTH < 900) {
    renderer.setPixelRatio(1.5);
  } else if (SCREEN_WIDTH < 1200) {
    renderer.setPixelRatio(1);
  }

  window.addEventListener('resize', function () {
    const pixelRatio = window.devicePixelRatio;
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width < 600) {
      renderer.setPixelRatio(2);
    } else if (width < 900) {
      renderer.setPixelRatio(1.5);
    }
  });

  container = document.getElementById('ThreeJS');
  container.appendChild(renderer.domElement);
  // CONTROLS
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;

  // EVENTS
  var domEvents = new THREEx.DomEvents(camera, renderer.domElement);

  //see if video is playing, add property
  Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function () {
      return !!(
        this.currentTime > 0 &&
        !this.paused &&
        !this.ended &&
        this.readyState > 2
      );
    },
  });

  // EVENTS
  THREEx.WindowResize(renderer, camera);
  THREEx.FullScreen.bindKey({ charCode: 'm'.charCodeAt(0) });

  // STATS
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild(stats.domElement);

  // LIGHT

  //const datGui  = new dat.GUI({ autoPlace: true });
  //datGui.domElement.id = 'gui';

  let ambient = new THREE.AmbientLight(0x555555, 1.5);
  scene.add(ambient);

  var light = new THREE.PointLight(0xffffff, 0.49);
  light.position.set(0, 5000, -1850);

  let lightTarget = new THREE.Object3D();
  lightTarget.position.set(0, 100, 700);
  scene.add(lightTarget);

  const spotLight = new THREE.SpotLight(0xffffff, 2.14, 1000, Math.PI / 4);
  spotLight.position.set(0, 91, 2000);

  spotLight.target = lightTarget;

  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;

  spotLight.shadow.camera.near = 0;
  spotLight.shadow.camera.far = 500;
  spotLight.shadow.camera.fov = 45;

  scene.add(spotLight);
  scene.add(light);

  // var posL = datGui.addFolder('position light');
  //posL.add(light.position, 'x', 0, 1000);
  //posL.add(light.position, 'y', -2000, 10000);
  //posL.add(light.position, 'z', -2000, 2000);
  //posL.add(light, 'intensity', 0, 10, 0.01);
  //var posL2 = datGui.addFolder('position light2');
  //posL2.add(spotLight.position, 'x', -1000, 1000);
  //posL2.add(spotLight.position, 'y', -2000, 2000);
  //posL2.add(spotLight.position, 'z', -2000, 2000);
  //posL2.add(spotLight, 'intensity', 0, 10, 0.01);

  // FLOOR
  floorTexture = loader.load('Three.js/images/tiles-1024.jpg');
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 10);
  var floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    side: THREE.DoubleSide,
  });
  var floorGeometry = new THREE.PlaneBufferGeometry(10000, 10000, 10, 10);
  var floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  floor.position.y = -0.5;
  floor.rotation.x = Math.PI / 2;
  scene.add(floor);

  //BG
  loader.load('Three.js/images/gradient-bg.png', function (texture) {
    scene.background = texture;
  });

  //create the cards
  fetch('./json/cardTextures-LR.json')
    .then((response) => response.json())
    .then((data) => createCards(data));

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const originalCardGeo = new THREE.PlaneBufferGeometry(108, 170);

  const createCards = async (data) => {
    for (let i = 0; i < 30; i++) {
      cardGeo = originalCardGeo.clone();

      const backTexture = new THREE.TextureLoader(loadingManager).load(
        data[i].back
      );

      backTexture.minFilter = THREE.LinearFilter;
      backTexture.generateMipmaps = false;

      const frontTexture = new THREE.TextureLoader(loadingManager).load(
        data[i].front
      );

      frontTexture.wrapS = THREE.RepeatWrapping;
      frontTexture.repeat.x = -1;

      frontTexture.minFilter = THREE.LinearFilter;
      frontTexture.generateMipmaps = false;

      if (backTexture) {
        renderer.initTexture(backTexture);
      }
      if (frontTexture) {
        renderer.initTexture(frontTexture);
      }

      const normalMap = new THREE.TextureLoader(loadingManager).load(
        './Three.js/images/paperNormalMap.jpg'
      );

      var frontMaterial = new THREE.MeshStandardMaterial({
        map: frontTexture,
        side: THREE.BackSide,
      });
      var backMaterial = new THREE.MeshStandardMaterial({
        map: backTexture,
        side: THREE.FrontSide,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(1.2, 1.2),
      });

      card = new THREE.Group();

      cardFront = new THREE.Mesh(cardGeo, frontMaterial);
      cardBack = new THREE.Mesh(cardGeo, backMaterial);

      card.add(cardFront);
      card.add(cardBack);

      card.position.set(
        centerPoint.x + Math.cos(radianInterval * i) * carrouselRadius,
        140,
        centerPoint.z + Math.sin(radianInterval * i) * carrouselRadius
      );

      card.rotation.y = 0 * (Math.PI / 180);
      card.lookAt(new THREE.Vector3(0, 140, 0));
      carrousel.add(card);
      domEvents.addEventListener(card, 'click', onDocumentMouseDown, false);
      domEvents.addEventListener(
        card,
        'touchstart',
        onDocumentMouseDown,
        false
      );
      //await sleep(50);
    }
  };

  scene.add(carrousel);

  carrousel.position.set(0, 0, 600);
  camera.position.set(0, 150, 1500);

  //compile everything
  renderer.compile(scene, camera);

  //functionalities, events
  async function onDocumentMouseDown(event) {
    let targetCard = event.target;
    const target = new THREE.Vector3(
      targetCard.position.x,
      targetCard.position.y,
      targetCard.position.z
    );
    lastClicked = event.target.uuid;

    if (isAnimating) {
      return;
    }

    isAnimating = true;

    if (
      lastClicked === targetCard.uuid &&
      targetCard.getWorldPosition(target).z > 1140
    ) {
      let rotationY = targetCard.rotation.y;
      rotation = false;
      rotationY += 180 * (Math.PI / 180);
      var tweenRot = new TWEEN.Tween(targetCard.rotation)
        .to({ y: rotationY }, 500)
        .start()
        .onComplete(() => (isAnimating = false));
      tweenRot.easing(TWEEN.Easing.Quadratic.In);
      return;
    }

    isAnimating = false;
  }

  let scrollspeed = 0;
  document.addEventListener('wheel', (event) => {
    scrollspeed = event.deltaY * (Math.PI / 180) * 0.2;
    carrousel.rotation.y += -0.5 * scrollspeed;
    rotation = true;
  });

  let prevTouch;
  document.addEventListener('touchmove', (event) => {
    const TRAVEL_DISTANCE = 0.008;
    const touch = event.touches[0];
    if (!prevTouch) return (prevTouch = touch.clientX);

    if (touch.clientX < prevTouch) carrousel.rotation.y -= TRAVEL_DISTANCE; //go left
    if (touch.clientX > prevTouch) carrousel.rotation.y += TRAVEL_DISTANCE; //go right

    prevTouch = touch.clientX;
    rotation = true;
  });
}

function animate(time) {
  if (RESOURCES_LOADED == false) {
    requestAnimationFrame(animate);

    return;
  }

  let sec = time * 0.001;

  if ((playing = false)) {
    video.pause();
  }

  //floor movement
  floorTexture.offset.y -= 0.004;

  if (rotation == true) {
    carrousel.rotation.y += 0.0001;
  }

  requestAnimationFrame(animate);
  render();
  update();
}

function update() {
  if (keyboard.pressed('s')) {
    // stop video
    video.pause();
    video.currentTime = 0;
  }

  if (keyboard.pressed('r'))
    // rewind video
    video.currentTime = 0;

  //controls.update();
  TWEEN.update();
  stats.update();
}

function render(time) {
  renderer.render(scene, camera);
}
