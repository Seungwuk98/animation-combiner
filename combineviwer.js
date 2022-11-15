import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'

class CombiningLoad {

    constructor() {
        this._setCamera();
        this._setScene();
        this._setGround();
        this._setLight();
        this._setLoader();
        this._setExporter();
        this._setRenderer();
        this._setControl();
        this._onWindowResize();
        this._link = document.createElement('a');
    }

    buildModel(url) {
        this._removeFromViewerAndAddCharacter(url);
        this._setAnimationClock();
        this._animate();
    }
    
    extractAnimation(url) {
        this._fbxLoader.load(url, (object) => {
            this._extractAnimation(object)
        });
    }

    exportThisAvatar() {
        this._gltfExporter.parse(this._model, (gltf) => {
            if (gltf instanceof ArrayBuffer) {
                this._saveArrayBuffer(gltf, 'avatar.glb');
            } else {
                const result = JSON.stringify( gltf, null, 2);
                this._saveString( result, 'avatar.gltf');
            }
        });
    }


    _save( blob, filename ) {
        this._link.href = URL.createObjectURL( blob );
        this._link.download = filename;
        this._link.click();
        // URL.revokeObjectURL( url ); breaks Firefox...
    }


    _saveString( text, filename ) {
        this._save( new Blob( [ text ], { type: 'text/plain' } ), filename );
    }

    _saveArrayBuffer( buffer, filename ) {
        this._save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
    }

    _extractAnimation(object) {
        object.animations.forEach((value) => {
            console.log(value);
            this._animationDict.push(this._mixer.clipAction(value))
        });
        this._refreshGUI();
    }

    _setUrl(url) {
        this._url = url;
    }

    _setCamera() {
        this._camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
        this._camera.position.set(0, 200, 300);
    }

    _setScene() {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0xa0a0a0);
        this._scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);
    }

    _setGround() {
        const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
        mesh.rotation.x = - Math.PI / 2;
        mesh.receiveShadow = true;
        this._scene.add( mesh );

        const grid = new THREE.GridHelper( 2000, 40, 0x000000, 0x000000 );
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        grid.receiveShadow = true;
        this._scene.add( grid );
    }

    _setLight() {
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
        hemiLight.position.set(0, 200, 300);
        this._scene.add(hemiLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(-100, 200, 0);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 500;
        dirLight.shadow.camera.bottom = -500;
        dirLight.shadow.camera.left = -500;
        dirLight.shadow.camera.right = 500;
        this._scene.add(dirLight);
    
        const dirLight2 = new THREE.DirectionalLight(0xffffff);
        dirLight.position.set(-100, 200, 0);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 500;
        dirLight.shadow.camera.bottom = -500;
        dirLight.shadow.camera.left = -500;
        dirLight.shadow.camera.right = 500;
        this._scene.add(dirLight2);
    }

    _setLoader() {
        this._fbxLoader = new FBXLoader();
        this._gltfLoader = new GLTFLoader();
    }

    _setExporter() {
        this._gltfExporter = new GLTFExporter();
    }

    _setModel() {
        this._fbxLoader.load(this._url, (object) => {
            this._model = object;
            this._character = object;
            this._scene.add(object);
            
            this._mixer = new THREE.AnimationMixer(object);
            this._setAnimation();
            this._setGUI();
            this._extractAnimation(object);
            this._animation['animation'].play();
            
            object.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
                if (child instanceof THREE.Bone) {
                    child.name = child.name.replace(/^mixamorig12|^mixamorig1|^mixamorig2/, 'mixamorig')
                }
            });
        });
    }
    
    _setAnimation() {
        this._animation = {
            previous: null,
            animation: null
        };
        this._animationDict = [];
        this._listDict = {}
    }

    _setGUI() {
        this._gui = new GUI( {width : 300} );
    }

    _refreshGUI() {
        this._gui.destroy();
        this._setGUI()
        if (this._animation['previous']) this._animation['previous'].fadeOut();
        this._animation['animation'] = this._animation['previous'] = this._animationDict[0]
        this._animationDict[0].reset().fadeIn(0.5).play();
        this._animationDict.forEach((value, index) => {
            this._listDict[`animation : ${index}`] = value;
        })
        this._animationList = this._gui.add(this._animation, 'animation', this._listDict).onChange(this._changeAnimation.bind(this));
    }

    _changeAnimation() {
        if (this._animation['previous'] !== this._animation['animation']) {
            this._animation['previous'].fadeOut(0.5);
            this._animation['animation'].reset().fadeIn(0.5).play();
            this._animation['previous'] = this._animation['animation'];
        }  
    }

    
    _setRenderer() {
        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setPixelRatio( window.devicePixelRatio );
        this._renderer.setSize( window.innerWidth, window.innerHeight );
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.VSMShadowMap;
        document.body.appendChild( this._renderer.domElement );
    }

    _setControl() {
        this._controls = new OrbitControls( this._camera, this._renderer.domElement );
        this._controls.target.set(0, 100, 0);
        this._controls.update();
    }

    _onWindowResize() {
        window.addEventListener('resize', () => {
            this._camera.aspect = window.innerWidth / window.innerHeight;
            this._camera.updateProjectionMatrix();
            
            this._renderer.setSize(window.innerWidth, window.innerHeight);
        })
    }

    _setAnimationClock() {
        this._clock = new THREE.Clock();
    }

    _animate() {
        requestAnimationFrame(this._animate.bind(this));
        const delta = this._clock.getDelta();
        this._renderer.render(this._scene, this._camera);
        if (this._mixer) {
            this._mixer.update(delta);
        }
    }

    _removeFromViewerAndAddCharacter(url) {
        if (this._character) this._scene.remove(this._character);
        this._setUrl(url);
        this._setModel();
    }

}

export let loadAvatar = new CombiningLoad();
loadAvatar.buildModel('./default.fbx')
