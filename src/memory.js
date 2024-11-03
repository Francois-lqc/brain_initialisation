"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import * as THREE from 'three';

import { initializeMain } from './main.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let cards;
let positions;
const colors = [0xFFFF00, 0x008000, 0x0000FF, 0xFF0000, 0xFF1493, 0x9400D3];
let carpetGeometry;
let carpetMaterial;
let carpet;

let scene, aspect, camera, renderer, controls, environment, pmremGenerator;
export function initializeMemory() {
  console.log("inside initialize memory game");

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

  // LIGHT
  environment = new RoomEnvironment();
  pmremGenerator = new THREE.PMREMGenerator(renderer);

  scene.background = new THREE.Color(0xbbbbbb);
  scene.environment = pmremGenerator.fromScene(environment).texture;

  controls = new OrbitControls(camera, renderer.domElement);
  controls.listenToKeyEvents(window); // optional

  window.addEventListener('click', onCardClick);
  window.addEventListener('touch', onCardClick);
  window.addEventListener('resize', onWindowResize, false);

  objectNameDiv.innerHTML = `Cliquez sur une carte pour la révéler.`
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

    window.removeEventListener('resize', onWindowResize);
    window.removeEventListener('click', onCardClick);
    window.removeEventListener('touch', onCardClick);

    objectNameDiv.style.visibility = 'hidden';

    switchSceneButton.visibility = 'hidden';

    document.body.removeChild(switchSceneButton);
    initializeMain();

  };
  document.body.appendChild(switchSceneButton);

  camera.position.z = 3;

  cards = [];
  positions = [];
  setupGame();
  animation();
}

function setupGame() {
  colors.forEach(color => {
    console.log("card color is : " + colors);
    // Add pairs
    cards.push(createCard(color));
    cards.push(createCard(color));
  });

  // Mix and put the cards
  cards = cards.sort(() => Math.random() - 0.5);

  for (let i = 0; i < cards.length; i++) {
    const x = (i % 4) * 1.5 - 2.25;
    const y = Math.floor(i / 4) * 2 - 1.5;
    cards[i].position.set(x, y, 0);
    scene.add(cards[i]);
    positions.push(cards[i].position.clone());
  }

  // Add the carpet 
  carpetGeometry = new THREE.BoxGeometry(1 * cards.length, 1.5 * cards.length, 0.1);
  carpetMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  carpet = new THREE.Mesh(carpetGeometry, carpetMaterial);
  carpet.position.set(0, 0, -0.1);
  scene.add(carpet);
}

const createCard = (color) => {
  const geometry = new THREE.BoxGeometry(1, 1.5, 0.1);
  const frontMaterial = new THREE.MeshStandardMaterial({ color: color }); // Front side color
  const backMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 }); // Back side color (white)

  const materials = [backMaterial, backMaterial, backMaterial, backMaterial, backMaterial, frontMaterial];

  const card = new THREE.Mesh(geometry, materials);
  card.userData.originalColor = color; // Store original color for game logic
  return card;
};

// Instruction text
const objectNameDiv = document.getElementById('object-name');


// Main loop
const animation = () => {

  renderer.setAnimationLoop(animation); // requestAnimationFrame() replacement, compatible with XR 
  renderer.render(scene, camera);
};

let firstCard = null;
let secondCard = null;

const onCardClick = (event) => {
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cards);

  if (intersects.length > 0) {
    const clickedCard = intersects[0].object;
    if (!firstCard) {
      firstCard = clickedCard;
      console.log(firstCard.material[0].color.getHex());
      firstCard.material[0].color.set(firstCard.material[5].color.getHex());
    } else if (!secondCard && clickedCard !== firstCard) {
      secondCard = clickedCard;
      secondCard.material[0].color.set(secondCard.material[5].color.getHex());

      // Check if the second card corresponds to the first
      if (firstCard.material[0].color.getHex() === secondCard.material[0].color.getHex()) {
        firstCard = null;
        secondCard = null; // Réinitialiser
      } else {
        setTimeout(() => {
          firstCard.material[0].color.set(0x808080); // Retourner la carte
          secondCard.material[0].color.set(0x808080); // Retourner la carte
          firstCard = null;
          secondCard = null;
        }, 500);
      };
    }
  }
};


function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}
