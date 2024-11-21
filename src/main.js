"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import * as THREE from 'three';

import { initializeBox } from './putObjectsBox.js';

import { initializeMemory } from './memory.js';

import { initializeColorGame } from './selectColors.js';

import { initializeListenAudio } from './listenAudio.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// AUDIO
var audioLoader = new THREE.AudioLoader();
var listener = new THREE.AudioListener();
var backgroundAudio = new THREE.Audio(listener);
audioLoader.load("audios/background_sound.mp3", function (buffer) {
  backgroundAudio.setBuffer(buffer);
  backgroundAudio.setLoop(true);
  backgroundAudio.setVolume(1);
  backgroundAudio.play();
});

let scene, aspect, camera, renderer, controls, environment, pmremGenerator;
export function initializeMain() {
  console.log("Initializing main scene");

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

  window.addEventListener('resize', onWindowResize, false);
  // Event listener to handle clicked object in the scene
  window.addEventListener('dblclick', () => lookAtObjectByName());
  window.addEventListener('touch', () => lookAtObjectByName());

  objectNameDiv.innerHTML = `Faites un double clique sur une partie du cerveau pour une description.<br> Faite un double clique en dehors du cerveau pour enlever la description.`;
  objectNameDiv.style.visibility = 'visible';


  // Button to go to treasure mini game
  const boxSceneButton = document.createElement('button');
  boxSceneButton.innerText = 'Jeu du trésor';
  boxSceneButton.style.top = '1px';
  boxSceneButton.style.right = '10px';

  boxSceneButton.onclick = () => {
    scene.clear();
    camera.clear();
    renderer.setAnimationLoop(null);
    renderer.clear();

    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('dblclick', () => lookAtObjectByName());
    window.removeEventListener('touch', () => lookAtObjectByName());
    boxSceneButton.visibility = 'hidden';

    document.body.removeChild(boxSceneButton);
    document.body.removeChild(colorsSceneButton);
    document.body.removeChild(memorySceneButton);
    document.body.removeChild(audioSceneButton);

    initializeBox();
  };
  document.body.appendChild(boxSceneButton);

  // Button to go to memory mini game
  const memorySceneButton = document.createElement('button');
  memorySceneButton.innerText = 'Jeu des cartes';
  memorySceneButton.style.top = '50px';
  memorySceneButton.style.right = '10px';

  memorySceneButton.onclick = () => {
    scene.clear();
    camera.clear();
    renderer.setAnimationLoop(null);
    renderer.clear();

    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('dblclick', () => lookAtObjectByName());
    window.removeEventListener('touch', () => lookAtObjectByName());
    memorySceneButton.visibility = 'hidden';

    document.body.removeChild(memorySceneButton);
    document.body.removeChild(boxSceneButton);
    document.body.removeChild(colorsSceneButton);
    document.body.removeChild(audioSceneButton);

    initializeMemory();
  };
  document.body.appendChild(memorySceneButton);

  // Button to go to cards mini game
  const colorsSceneButton = document.createElement('button');
  colorsSceneButton.innerText = 'Jeu des couleurs';
  colorsSceneButton.style.top = '100px';
  colorsSceneButton.style.right = '10px';

  colorsSceneButton.onclick = () => {
    scene.clear();
    camera.clear();
    renderer.setAnimationLoop(null);
    renderer.clear();

    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('dblclick', () => lookAtObjectByName());
    window.removeEventListener('touch', () => lookAtObjectByName());
    colorsSceneButton.visibility = 'hidden';

    document.body.removeChild(colorsSceneButton);
    document.body.removeChild(boxSceneButton);
    document.body.removeChild(memorySceneButton);
    document.body.removeChild(audioSceneButton);

    initializeColorGame();
  };
  document.body.appendChild(colorsSceneButton);

  // Button to go to audio mini game
  const audioSceneButton = document.createElement('button');
  audioSceneButton.innerText = 'Jeu du son';
  audioSceneButton.style.top = '150px';
  audioSceneButton.style.right = '10px';

  audioSceneButton.onclick = () => {
    backgroundAudio.pause();
    scene.clear();
    camera.clear();
    renderer.setAnimationLoop(null);
    renderer.clear();

    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('dblclick', () => lookAtObjectByName());
    window.removeEventListener('touch', () => lookAtObjectByName());
    audioSceneButton.visibility = 'hidden';

    document.body.removeChild(colorsSceneButton);
    document.body.removeChild(boxSceneButton);
    document.body.removeChild(memorySceneButton);
    document.body.removeChild(audioSceneButton);

    initializeListenAudio();
  };
  document.body.appendChild(audioSceneButton);

  camera.position.z = 3;

  loadData();
  animation();
}

function loadData() {
  new GLTFLoader()
    .setPath('assets/models/')
    .load('big_brain.glb', gltfReader);
}

let brain;
function gltfReader(gltf) {
  let testModel = null;
  console.log("gltfReader main");
  testModel = gltf.scene;

  if (testModel != null) {
    console.log("Model loaded:  " + testModel.name);
    scene.add(testModel);
    brain = scene.getObjectByName("Brain");
    console.log("Brain loaded: " + brain.name);
  } else {
    console.log("Load FAILED.  ");
  }
}

let brain_rotate = true;

// Text describing different parts of brain
const objectNameDiv = document.getElementById('object-name');

const descriptions = {
  'Frontal_Lobe': 'Lobe Frontal : <br> Situé à l\'avant du cerveau, le lobe frontal est impliqué dans des fonctions complexes comme la prise de décision, le raisonnement, la planification, le mouvement volontaire et le contrôle des impulsions.Il joue aussi un rôle crucial dans la régulation des émotions, la personnalité, et le langage(surtout dans l\'hémisphère gauche avec l\'aire de Broca).<br> Vous pouvez écouter la musique du menu ou lancer le jeu musical pour stimuler cette partie du cerveau.',
  'Parietal_Lobe': 'Lobe Pariétal : <br> Situé au sommet du cerveau, le lobe pariétal traite principalement les informations sensorielles provenant de différentes parties du corps, comme la température, la douleur, le toucher et la position spatiale.Il est essentiel pour l\'intégration sensorielle et la perception spatiale, contribuant également aux mouvements complexes et à la reconnaissance des objets.<br> Vous pouvez jouer au jeu du trésor pour stimuler cette partie du cerveau.',
  'Temporal_Lobe': 'Lobe Temporal : <br> Ce lobe, situé au niveau des tempes, est principalement responsable de la perception auditive et de la compréhension du langage(notamment via l\'aire de Wernicke). Il joue également un rôle dans la mémoire à long terme et est impliqué dans la reconnaissance des visages et des émotions.<br> Vous pouvez jouer au jeu des cartes pour stimuler cette partie du cerveau.',
  'Occipital_Lobe': 'Lobe Occipital : <br> Localisé à l\'arrière du cerveau, le lobe occipital est principalement dédié au traitement des informations visuelles. Il reçoit les signaux en provenance des yeux et les interprète, nous permettant ainsi de percevoir et d\'identifier les formes, les couleurs, les mouvements et les objets dans notre environnement.<br> Vous pouvez jouer au jeu des couleurs pour stimuler cette partie du cerveau.',
};

let objectScaled = [];
// Function to look at a part of brain
function lookAtObjectByName() {
  // Calculate mouse position according to the screen
  const mouse = new THREE.Vector3();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  //Raycaster to detect clicked object
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  // List of objects intersecting with the raycaster
  const intersects = raycaster.intersectObjects(scene.children);
  let targetObject = null;

  if (intersects.length > 0) {
    // Get the clicked object
    const clickedObject = intersects[0].object;
    targetObject = brain.getObjectByName(clickedObject.name).parent;
  }

  if (targetObject) {
    // add clicked object to the scaled objects array
    objectScaled.push(targetObject);
    // Compute camera position
    const targetWorldPosition = new THREE.Vector3();
    targetObject.getWorldPosition(targetWorldPosition);

    brain_rotate = false;

    objectNameDiv.innerHTML = `${descriptions[targetObject.name]}`;
    objectNameDiv.style.visibility = 'visible';
    // Make object 10% bigger
    targetObject.scale.set(targetObject.scale.x + 0.1, targetObject.scale.y + 0.1, targetObject.scale.z + 0.1)
  }
  else {
    brain_rotate = true;
    objectNameDiv.style.visibility = 'hidden';
    // To revert back scaled object
    objectScaled.forEach(object => { object.scale.set(object.scale.x - 0.1, object.scale.y - 0.1, object.scale.z - 0.1) });
    objectScaled = [];
  }
}

const clock = new THREE.Clock();

// Main loop
const animation = () => {
  renderer.setAnimationLoop(animation); // requestAnimationFrame() replacement, compatible with XR 

  let elapsed = clock.getElapsedTime();

  if (!brain_rotate)
    elapsed = clock.oldTime;
  if (brain_rotate && brain) {
    brain.rotation.y = elapsed / 2;
    elapsed = clock.getElapsedTime();
  }
  renderer.render(scene, camera);
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
