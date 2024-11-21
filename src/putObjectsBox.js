"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import * as THREE from 'three';

import { initializeMain } from './main.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

let scene, aspect, camera, renderer, controls, environment, pmremGenerator;
export function initializeBox() {
    console.log("inside initialize Box");

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

    window.addEventListener('mousedown', onMouseDown, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('resize', onWindowResize, false);

    objectNameDiv.innerHTML = `Cliquez sur une pièce pour la sélectionner.<br> Utilisez les flèches pour la déplacer.`;
    objectNameDiv.style.visibility = 'visible';

    // Button to switch back to main scene
    const switchSceneButton = document.createElement('button');
    switchSceneButton.innerText = 'Retour au cerveau';
    switchSceneButton.style.top = '1px';
    switchSceneButton.style.right = '10px';

    switchSceneButton.onclick = () => {
        console.log("Retour au cerveau");

        camera.clear();
        renderer.setAnimationLoop(null);
        renderer.clear();


        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', onWindowResize);

        objectNameDiv.style.visibility = 'hidden';

        switchSceneButton.visibility = 'hidden';

        document.body.removeChild(switchSceneButton);
        initializeMain();
    };
    document.body.appendChild(switchSceneButton);

    camera.position.z = 3;

    loadBoxData();
    loadCoinData();
    animation();

}
let box;
let boxDetection;
let coins = [];

function RandomValue(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function loadBoxData() {
    new GLTFLoader()
        .setPath('assets/models/')
        .load('empty_box.glb', gltfBoxReader);
}

function gltfBoxReader(gltf) {
    let testModel = null;

    testModel = gltf.scene;

    if (testModel != null) {
        console.log("Model loaded:  " + testModel);
        scene.add(gltf.scene);
        box = scene.getObjectByName("Empty_Box");
        boxDetection = scene.getObjectByName("BoxDetection");
        console.log("BoxDetection:  " + boxDetection);
        if (boxDetection != null)
            boxDetection.visible = false;
    } else {
        console.log("Load FAILED.  ");
    }
}

function loadCoinData() {
    new GLTFLoader()
        .setPath('assets/models/')
        .load('coin.glb', gltfCoinReader);
}

function gltfCoinReader(gltf) {
    let testModel = null;

    testModel = gltf.scene;

    if (testModel != null) {
        console.log("Model loaded:  " + testModel);
        for (let i = 1; i <= 3; i++) {
            const clone = gltf.scene.clone();
            clone.position.set(RandomValue(-10, 10), 0.75, RandomValue(-10, 10));
            clone.name = "Coin_" + i;
            scene.add(clone); // Add the wrapper to the scene
            coins.push(clone); // Store the wrapper instead of the clone
        }

    } else {
        console.log("Load FAILED.");
    }
}

// Instruction text
const objectNameDiv = document.getElementById('object-name');

// Main loop
const animation = () => {

    renderer.setAnimationLoop(animation);
    renderer.render(scene, camera);

    if (coins.length > 0) {
        for (let i = 0; i < coins.length; i++) {
            if (isCoinInBox(coins[i])) {
                if (!coins[i].insideBox) {  // Only play sound if it's entering for the first time
                    audio.play();
                    coins[i].insideBox = true;  // Mark the coin as inside the box
                }
            } else {
                coins[i].insideBox = false; // Reset if coin exits box
            }
        }
    };
};

//Sound when the coin is on the box

function isCoinInBox(coin) {
    if (!boxDetection)
        return false;
    const boxBounds = new THREE.Box3().setFromObject(boxDetection);
    const coinBounds = new THREE.Box3().setFromObject(coin);

    // Check if the coin bounds intersect with the box bounds
    return boxBounds.intersectsBox(coinBounds);
}
// AUDIO
var audioLoader = new THREE.AudioLoader();
var listener = new THREE.AudioListener();
var audio = new THREE.Audio(listener);
audioLoader.load("assets/mario-coin.mp3", function (buffer) {
    audio.setBuffer(buffer);
    audio.setLoop(false);
    audio.setVolume(0.5);
});

// Select and move the coin
let selectedCoin = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function onMouseDown(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(coins);

    if (intersects.length > 0) {
        selectedCoin = intersects[0].object; // Select the clicked coin
        controls.enabled = false; // Disable the controls
        console.log("Coin selected");
    } else { // Deselect if clicked elsewhere
        if (selectedCoin) {
            selectedCoin = null;
            controls.enabled = true;
            console.log("Coin deselected");
        }
    }
}

function onKeyDown(event) {
    if (!selectedCoin) return;

    const moveDistance = 3; // Set the distance to move per key press

    switch (event.key) { // Move depending on the pressed key
        case 'ArrowUp':
            selectedCoin.position.x -= moveDistance;
            break;
        case 'ArrowDown':
            selectedCoin.position.x += moveDistance;
            break;
        case 'ArrowLeft':
            selectedCoin.position.z += moveDistance;
            break;
        case 'ArrowRight':
            selectedCoin.position.z -= moveDistance;
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}
