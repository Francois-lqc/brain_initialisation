"use strict";

// Import only what you need, to help your bundler optimize final code size using tree shaking
// see https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking)

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { initializeMain } from './main.js';

// AUDIO
var audioTestLoader;
var listener;
var audioTest;
var audioLoader;
var backgroundAudio;


let scene, aspect, camera, renderer, controls, environment, pmremGenerator;
export function initializeListenAudio() {
    console.log("inside initialize listen game");

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


    if (!backgroundAudio) {
        audioLoader = new THREE.AudioLoader();
        listener = new THREE.AudioListener();
        backgroundAudio = new THREE.Audio(listener);
        audioLoader.load("brain_initialisation/assets/audios/background_sound.mp3", function (buffer) {
            backgroundAudio.setBuffer(buffer);
            backgroundAudio.setLoop(true);
            backgroundAudio.setVolume(1);
            backgroundAudio.play();
        });
    }

    audioTestLoader = new THREE.AudioLoader();
    listener = new THREE.AudioListener();
    camera.add(listener);
    audioTest = new THREE.Audio(listener);
    audioTestLoader.load("brain_initialisation/assets/audios/Violon_music_Sam_Marshall.mp3", function (buffer) {
        audioTest.setBuffer(buffer);
        audioTest.setLoop(false);
        audioTest.setVolume(1);
    });

    objectNameDiv.innerHTML = `Cliquez sur le bouton pour entendre une nouvelle musique`;
    objectNameDiv.style.visibility = 'visible';

    // Button to switch back to main scene
    const switchSceneButton = document.createElement('button');
    switchSceneButton.innerText = 'Retour au cerveau';
    switchSceneButton.style.top = '1px';
    switchSceneButton.style.right = '10px';

    switchSceneButton.onclick = () => {
        console.log("Retour au cerveau");

        audioTest.pause();
        backgroundAudio.play();

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

    loadData();
    animation();

}


let buttonGlobal;
let button;

function loadData() {
    new GLTFLoader()
        .setPath('brain_initialisation/assets/models/')
        .load('button.glb', gltfReader);
}

function gltfReader(gltf) {
    let testModel = null;

    testModel = gltf.scene;

    if (testModel != null) {
        console.log("Model loaded:  " + testModel);
        scene.add(gltf.scene);
        buttonGlobal = scene.getObjectByName("ButtonGlobal");
        button = scene.getObjectByName("1");
    } else {
        console.log("Load FAILED.");
    }
}

// Instruction text
const objectNameDiv = document.getElementById('object-name');

// Main loop
const animation = () => {

    renderer.setAnimationLoop(animation); // requestAnimationFrame() replacement, compatible with XR 
    renderer.render(scene, camera);
};


let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
function clickButton(event) {
    if (!button)
        return;
    console.log("clickButton");
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(button);

    if (intersects.length > 0) {
        if (audioTest.isPlaying) {
            audioTest.pause();
            backgroundAudio.play();
        } else {
            backgroundAudio.pause();
            audioTest.play();
        }
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}
