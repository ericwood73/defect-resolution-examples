import PhotosphereTransition from "./photosphere-transition";
import PhotosphereCamera from "../photosphere-camera";
import Photosphere from "../photospheres/photosphere";
import { PhotosphereData } from "../models/photosphere.model";
import gsap from "gsap";
import PhotosphereScene from "../photosphere-scene";

export default class ZoomTransition extends PhotosphereTransition {

    constructor(photosphereScene: PhotosphereScene, fromPhotosphere: Photosphere, toPhotosphereData: PhotosphereData) {
        super(photosphereScene, fromPhotosphere, toPhotosphereData)
    }

    override startTransition(callback: (newPhotosphere: Photosphere) => void): void {
        this.camera.transitioning = true;
        this.camera.enabled = false;
        var from = this.camera.fov;
        var to = 0;

        gsap.fromTo(this.camera, {fov: from}, {fov: to, duration: 0.5, yoyo: true, repeat: 1, onUpdate:() => {
            this.camera.updateProjectionMatrix();

        }, onRepeat:() => {
            console.log("SWAP PHOTOSPHERES")
            this.toPhotosphere = new Photosphere(this.toPhotosphereData);
            this.scene.add(this.toPhotosphere);
            if(this.toPhotosphereData.rotation?.start) {
                this.camera.lookAtAzimuth(this.toPhotosphereData.rotation?.start);
            }
            this.fromPhotosphere.removeFromParent();
        }, onComplete: () => {
            console.log("TRANSITION COMPLETE");
            this.camera.transitioning = false;
            this.camera.enabled = true;
            callback(this.toPhotosphere!);
        }})
    }
}