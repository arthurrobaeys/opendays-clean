// standard global variables
let cardData = [];
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
let lastCard = null;
let RESOURCES_LOADED = false;
let LOADING_MANAGER = null;
var SCREEN_WIDTH = window.innerWidth,
  SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45,
  ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
  NEAR = 0.1,
  FAR = 5000;

const bgMusic = new Audio('Three.js/sounds/bg_audio_new.mp3');
bgMusic.volume = 0.035; //donut forget to turn 0.05
bgMusic.loop = true;

bgMusic.addEventListener(
  'ended',
  function () {
    this.currentTime = 0;
    this.play();
  },
  false
);

const cardSound = new Audio();
cardSound.volume = 0.5;

const labelMusic = document.querySelector('.mute-label');

// loading screen
const loadingScreen = document.querySelector('.loadingScreen');
const continueBtn = document.querySelector('.continue-btn');
const loadingTxt = document.querySelector('.loading-txt');

//tooltips
const tooltips = document.querySelector('.tooltips');

//vars for carrousel
let numOfCards = 30;
let carrousel = new THREE.Group();
let carrouselRadius = 630;
let isAnimating = false;
let carrouselMobileRot;
let startRot = -1.570; //0.105 

const CARD_STATES = {};

const radianInterval = (2 * Math.PI) / numOfCards;
const centerPoint = { x: 0, y: 150, z: 0 };

init();
animate();

// FUNCTIONS
function init() {
  loadingManager = new THREE.LoadingManager();

  const loadBar = document.querySelector('.loading');

  loadingManager.onProgress = function (item, loaded, total) {
    loadBar.style.width = (loaded / total) * 45 + '%';
  };

  loadingManager.onLoad = function () {
    RESOURCES_LOADED = true;
    continueBtn.style.display = 'block';
    loadingTxt.style.display = 'none';
    //setDisplayNone();
    continueBtn.addEventListener('click', setDisplayNone);
  };

  const setDisplayNone = async (e) => {
    await fadeOut();
    bgMusic.play();
  };

  const fadeOut = async () => {
    loadingScreen.classList.add('fade-out');
    await setTimeout(function () {
      loadingScreen.style.display = 'none';
    }, 1000);
  };

  const fadeOutTooltips = async () => {
    tooltips.classList.add('fade-out-tool');
    setTimeout(function () {
      tooltips.style.display = 'none';
    }, 1000);
  };

  tooltips.addEventListener('touchstart', fadeOutTooltips);
  tooltips.addEventListener('click', fadeOutTooltips);

  //UI INTERACTION
  const muteDiv = document.querySelector('.mute-div');
  const muteBtn = document.querySelector('.mute-btn');
  const muteLabel = document.querySelector('.mute-label');

  muteDiv.addEventListener('click', function (e) {
    const child = e.target.matches('.mute-btn, .mute-label');
    if (child) {
      if (bgMusic.muted == true) {
        bgMusic.muted = false;
        muteBtn.src = 'Three.js/images/music-on.svg';
        muteLabel.textContent = 'Music on';
        return;
      } else if (bgMusic.muted == false) {
        bgMusic.muted = true;
        muteBtn.classList.remove('muted');
        muteBtn.src = 'Three.js/images/music-off.svg';
        muteLabel.textContent = 'Music off';
      }
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
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } else {
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
    renderer.setPixelRatio(1.3);
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
  // stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.bottom = '0px';
  // stats.domElement.style.zIndex = 100;
  // container.appendChild(stats.domElement);

  // LIGHT

  //const datGui  = new dat.GUI({ autoPlace: true });
  //datGui.domElement.id = 'gui';

  let ambient = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambient);

  var light = new THREE.PointLight(0xe722c6, 1.0);
  light.position.set(468, 3612, -306);

  let lightTarget = new THREE.Object3D();
  lightTarget.position.set(0, 100, 700);
  scene.add(lightTarget);

  const spotLight = new THREE.SpotLight(0xffffff, 2.03, 1000, Math.PI / 4);
  spotLight.position.set(-175, -306, 1503);

  const spotAmbient = new THREE.SpotLight(0xe722c6, 2.03, 900, Math.PI / 4);
  spotAmbient.position.set(-175, -306, 1503);

  spotLight.target = lightTarget;
  spotAmbient.target = lightTarget;

  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;

  spotLight.shadow.camera.near = 0;
  spotLight.shadow.camera.far = 500;
  spotLight.shadow.camera.fov = 45;

  scene.add(spotLight);
  scene.add(spotAmbient);
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
  floorTexture = loader.load('Three.js/images/neon_grid.png');
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
  loader.load('Three.js/images/bg_neon2.jpg', function (texture) {
    scene.background = texture;
    scene.fog = new THREE.Fog(0xe722c6, 1000, 2500);
  });

  //create the cards
  fetch('./json/cardTextures-new.json')
    .then((response) => response.json())
    .then((data) => createCards(data));

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const originalCardGeo = new THREE.PlaneBufferGeometry(108, 170);

  const createCards = async (data) => {
    cardData = data;
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

      var frontMaterial = new THREE.MeshStandardMaterial({
        map: frontTexture,
        side: THREE.BackSide,
      });
      var backMaterial = new THREE.MeshStandardMaterial({
        map: backTexture,
        side: THREE.FrontSide,
      });

      card = new THREE.Group();
      card.index = i;

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

  const handleCardSound = () => {
    const activeCard = Object.entries(CARD_STATES).find(
      ([key, { isRotated }]) => isRotated === true
    );

    if (!activeCard) return cardSound.pause();

    const [key, { index }] = activeCard;
    cardSound.src = `Three.js/sounds/cards/${cardData[index].sound}`;
    cardSound.play();
  };

  //functionalities, events
  async function onDocumentMouseDown(event) {
    const targetCard = event.target;

    const target = new THREE.Vector3(
      targetCard.position.x,
      targetCard.position.y,
      targetCard.position.z
    );

    if (isAnimating) {
      return;
    }

    isAnimating = true;

    const rotateCard = (card, init) => {
      if (!CARD_STATES[card.uuid]) {
        CARD_STATES[card.uuid] = {};
        CARD_STATES[card.uuid].isRotated = null;
        CARD_STATES[card.uuid].index = card.index;
      }

      let rotationY = card.rotation.y + 180 * (Math.PI / 180);

      if (init) {
        if (!CARD_STATES[card.uuid]?.isRotated) {
          rotationY = card.rotation.y;
        }

        CARD_STATES[card.uuid].isRotated = false;
      } else {
        CARD_STATES[card.uuid].isRotated = !CARD_STATES[card.uuid]?.isRotated;
      }

      rotation = false;

      var tweenRot = new TWEEN.Tween(card.rotation)
        .to({ y: rotationY }, 500)
        .start()
        .onComplete(() => (isAnimating = false));
      tweenRot.easing(TWEEN.Easing.Quadratic.In);
    };

    if (targetCard.getWorldPosition(target).z > 1140) {
      if (lastClicked && targetCard !== lastClicked) {
        lastCard = lastClicked;
      }

      lastCard && rotateCard(lastCard, true);
      rotateCard(targetCard, false);

      lastClicked = targetCard;

      handleCardSound();

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
}

let targetX = 0;
let targetY = 0;
let mouseX = 0;
let mouseY = 0;

const mousePanning = (e) => {
  const windowX = window.innerWidth / 2;
  const windowY = window.innerHeight / 2;

  mouseX = e.clientX - windowX;
  mouseY = e.clientY - windowY;
};

var isMobile = {
  Android: function () {
    return navigator.userAgent.match(/Android/i);
  },
  iOS: function () {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Windows: function () {
    return (
      navigator.userAgent.match(/IEMobile/i) ||
      navigator.userAgent.match(/WPDesktop/i)
    );
  },
  Opera: function () {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  BlackBerry: function () {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  any: function () {
    return (
      isMobile.Android() ||
      isMobile.BlackBerry() ||
      isMobile.iOS() ||
      isMobile.Opera() ||
      isMobile.Windows()
    );
  },
};

//specific mobile interactions
carrousel.rotation.y = startRot;
if (isMobile.any()) {

  let tapText = document.querySelector('.tap-txt');
  let swipeText = document.querySelector('.swipe-txt');

  tapText.textContent = 'Tap once to flip a card';
  swipeText.textContent = 'Swipe to navigate through the cards';

  var hammertime = new Hammer(document);
  hammertime.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });

  hammertime.on('swipe', function (ev) {
    if (ev.direction == 4) {
      carrouselMobileRot = 12 * (Math.PI / 180);
    } else if (ev.direction == 2) {
      carrouselMobileRot = -12 * (Math.PI / 180);
    }
    var tweenMobile = new TWEEN.Tween(carrousel.rotation)
      .to({ y: startRot + carrouselMobileRot }, 400)
      .start();
    startRot += carrouselMobileRot;
    tweenMobile.easing(TWEEN.Easing.Cubic.InOut);
  });
} else {
  document.addEventListener('mousemove', mousePanning);
}

document.addEventListener('keypress', function onEvent(event) {
  if (event.code === 'Space') {
    carrouselMobileRot = 12 * (Math.PI / 180);

    var tweenMobile = new TWEEN.Tween(carrousel.rotation)
      .to({ y: startRot + carrouselMobileRot }, 400)
      .start();
    startRot += carrouselMobileRot;
    tweenMobile.easing(TWEEN.Easing.Cubic.InOut);
  }
});

function animate(time) {
  if (RESOURCES_LOADED == false) {
    requestAnimationFrame(animate);

    return;
  }

  targetX = mouseX * 0.001;
  targetY = mouseY * 0.001;

  let sec = time * 0.001;

  if ((playing = false)) {
    video.pause();
  }

  //floor movement
  floorTexture.offset.y -= 0.004;

  if (!isMobile.any()) {
    camera.position.y = 150 + 0.05 * (mouseY - 150);
    camera.position.x = 0 + 0.05 * mouseX;
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
  //stats.update();
}

function render(time) {
  renderer.render(scene, camera);
}
