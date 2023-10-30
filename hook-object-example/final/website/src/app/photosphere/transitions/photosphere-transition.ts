import * as THREE from 'three';
import Photosphere from '../photospheres/photosphere';
import { PhotosphereData } from '../models/photosphere.model';
import PhotosphereCamera from '../photosphere-camera';
import gsap from 'gsap';
import PhotosphereScene from '../photosphere-scene';

export default class PhotosphereTransition {
    scene: THREE.Scene;
    camera: PhotosphereCamera;
    toPhotosphereData: PhotosphereData;
    toPhotosphere?: Photosphere;
    fromPhotosphere: Photosphere;
    

    constructor(photosphereScene: PhotosphereScene, fromPhotosphere: Photosphere, toPhotosphereData: PhotosphereData) {
        this.scene = photosphereScene.scene;
        this.camera = photosphereScene.camera;
        this.toPhotosphereData = toPhotosphereData;
        this.fromPhotosphere = fromPhotosphere;
    }

    startTransition(callback?: (newPhotosphere: Photosphere) => void) {
        this.camera.transitioning = true;
        this.camera.enabled = false;

        console.log("SWAP PHOTOSPHERES")
        this.toPhotosphere = new Photosphere(this.toPhotosphereData);
        this.scene.add(this.toPhotosphere);
        this.fromPhotosphere.removeFromParent();

        if(this.toPhotosphereData.rotation) {
            this.camera.setRotation(this.toPhotosphereData.rotation);
        }

        this.camera.transitioning = false;
        this.camera.enabled = true;

        if (callback) {
            callback(this.toPhotosphere);
        }
    }
}