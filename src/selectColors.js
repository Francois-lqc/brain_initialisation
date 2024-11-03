"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import * as THREE from './three';

import { initializeMain } from './main.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let cube;
let sphere;
let colors;
let sampleText;
let searchColor;

let scene, aspect, camera, renderer, controls, environment, pmremGenerator;
export function initializeColorGame() {
  console.log("inside initialize color game");

  // Check if the scene is already initialized
  const existingRenderer = document.querySelector('canvas');
  if (existingRenderer) {
    existingRenderer.remove();
  }

  // SCENE & CAMERA & RENDERER
  scene = new THREE.Scene();
  aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.listenToKeyEvents(window); // optional

  // LIGHT
  environment = new RoomEnvironment();
  pmremGenerator = new THREE.PMREMGenerator(renderer);

  scene.background = new THREE.Color(0xbbbbbb);
  scene.environment = pmremGenerator.fromScene(environment).texture;

  window.addEventListener('mousedown', clickButton, false);
  window.addEventListener('resize', onWindowResize, false);

  colors = { 'jaune': 0xFFFF00, 'verte': 0x008000, 'bleue': 0x0000FF, 'rouge': 0xFF0000, 'rose': 0xFF69B4 };
  sampleText = "Touchez / Attrapez la forme ";
  if (Math.random() < 0.5)
    searchColor = "bleue";
  else
    searchColor = "rouge";

  objectNameDiv.innerHTML = `${sampleText} <br> ${searchColor}`;
  objectNameDiv.style.visibility = 'visible';

  // Button to switch back to main scene
  const switchSceneButton = document.createElement('button');
  switchSceneButton.innerText = 'Retour au cerveau';
  switchSceneButton.style.top = '1px';
  switchSceneButton.style.right = '10px';

  switchSceneButton.onclick = () => {
    console.log("Retour au cerveau");

    scene.clear();
    camera.clear();
    renderer.setAnimationLoop(null);
    renderer.clear();
    objectNameDiv.style.visibility = 'hidden';

    switchSceneButton.visibility = 'hidden';

    window.removeEventListener('mousedown', clickButton);
    window.removeEventListener('resize', onWindowResize);

    document.body.removeChild(switchSceneButton);
    initializeMain();
  };
  document.body.appendChild(switchSceneButton);

  camera.position.z = 3;


  loadCubeData();
  loadSphereData();
  animation();

}

function loadCubeData() {
  new GLTFLoader()
    .setPath('brain_initiation/assets/models/')
    .load('cube.glb', gltfCubeReader);
}

// Instruction text
const objectNameDiv = document.getElementById('object-name');


function gltfCubeReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    scene.add(gltf.scene);
    cube = scene.getObjectByName("Mesh");
    cube.position.set(-2, 1, 0);
    cube.material.color.set(0xFF0000);
  } else {
    console.log("Load FAILED.  ");
  }
}
function loadSphereData() {
  new GLTFLoader()
    .setPath('brain_initiation/assets/models/')
    .load('sphere.glb', gltfSphereReader);
}

function gltfSphereReader(gltf) {
  let testModel = null;

  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel);
    scene.add(gltf.scene);
    sphere = scene.getObjectByName("Sphere");
    sphere.position.set(2, 0.5, 0);
    sphere.material.color.set(0x0000FF);
  } else {
    console.log("Load FAILED.  ");
  }
}

// Main loop
const animation = () => {

  renderer.setAnimationLoop(animation); // requestAnimationFrame() replacement, compatible with XR 
  renderer.render(scene, camera);
};


// Click
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
function clickButton(event) {
  function addFirework(nb_part) {
    const particles = [];
    const geometry = new THREE.SphereGeometry(0.05, 5, 5);

    for (let i = 0; i < nb_part; i++) {
      const color = Math.floor(Math.random() * 0xffffff);
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const particle = new THREE.Mesh(geometry, material.clone());
      particle.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2);
      particle.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
      particles.push(particle);
      scene.add(particle);
    }

    let duration = 25;
    function animateFirework() {
      if (duration-- > 0) {
        particles.forEach((particle) => {
          particle.position.add(particle.velocity);
          particle.material.opacity *= 0.95;
        });
        requestAnimationFrame(animateFirework);
      } else {
        particles.forEach(p => scene.remove(p));
      }
    }
    animateFirework();
  }
  if (!sphere || !cube)
    return;
  console.log("clickButton");
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Select the object
  let object;
  let other;
  const intersects = raycaster.intersectObject(sphere);
  if (intersects.length > 0) {
    object = sphere;
    other = cube;
  }
  else {
    const intersects2 = raycaster.intersectObject(cube);
    if (intersects2.length > 0) {
      object = cube;
      other = sphere;
    }
  }

  if (!object)
    return;

  const objectColor = object.material.color.getHex();
  const nameObjColor = Object.keys(colors).find(key => colors[key] === objectColor);
  const otherColor = other.material.color.getHex();
  const nameOtherColor = Object.keys(colors).find(key => colors[key] === otherColor);

  if (nameObjColor == searchColor) {
    delete colors[searchColor];
    const colorKeys = Object.keys(colors);
    console.log(colors);
    if (colorKeys.length > 1) {
      addFirework(30);
      // New color
      let newColor = colorKeys[Math.floor(Math.random() * (colorKeys.length))];
      while (colors[newColor] == otherColor)
        newColor = colorKeys[Math.floor(Math.random() * (colorKeys.length))];
      object.material.color.set(colors[newColor]);

      if (Math.random() < 0.6)
        searchColor = nameOtherColor;
      else
        searchColor = newColor;

      objectNameDiv.innerHTML = `${sampleText} <br> ${searchColor}`;
    }
    else if (colorKeys.length == 1) {
      addFirework(30);
      object.material.color.set(0x808080);
      searchColor = nameOtherColor;
      objectNameDiv.innerHTML = `${sampleText} <br> ${searchColor}`;
    }
    else {
      object.material.color.set(0x808080);
      addFirework(100);
      objectNameDiv.innerHTML = `Congratulations! You did it !!`;
    }
  }


}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
