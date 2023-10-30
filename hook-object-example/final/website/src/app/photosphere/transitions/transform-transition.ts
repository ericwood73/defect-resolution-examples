import PhotosphereTransition from "./photosphere-transition";
import PhotosphereCamera from "../photosphere-camera";
import Photosphere from "../photospheres/photosphere";
import Hotspot from "../hotspots/hotspot";
import { MinMaxAzimuth, PhotosphereData } from "../models/photosphere.model";
import { getClosestAngle, toSignedAngle } from "../helpers/angle-utils"
import gsap from "gsap";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import PhotosphereScene from "../photosphere-scene";
import { getDebugUI } from '../helpers/debug-ui'

// #region For tweaking settings only.  Remove in production.
const settings = {
    duration: 1,
    maxBlurRange: {
        min: 0,
        max: 0.01,
    },
    maxBlur: 0
}
const gui = getDebugUI().addFolder('Transition Blur Settings');
gui.close();
gui.add(settings, "duration", 0, 5, 0.5);
gui.add(settings.maxBlurRange, "min", 0, .01, .001).name("Min maxBlur");
gui.add(settings.maxBlurRange, "max", 0, .1, .005).name("Max maxBlur");
gui.add(settings, "maxBlur", 
        settings.maxBlurRange.min, 
        settings.maxBlurRange.max).listen();
// #endregion

// This tranisition creates the experience of the user being pulled into the new
// PoV from the current PoV.  To keep the current PoV centered at world origin,
// we achieve this by creating the destination photosphere tangent to the
// current photosphere along the hotspot azimuth and then animate both
// photospheres along the azimuth so that the desitination photosphere ends up
// at the world origin.  We then kill the origin photosphere.  At the midpoint
// of the transition, we will snap the camera azimuth to the closest limit if the 
// current azimuth is outside the limits of the destination photosphere.
export default class TransformTransition extends PhotosphereTransition {
    private photosphereScene: PhotosphereScene;
    private fromHotspot: Hotspot;
    private bokehPass: BokehPass;
    private effectController = {
        focus: 10,
        aperture: 1,
        maxBlur: 0.01
    };
    private duration = 5.0;
    
    constructor(photosphereScene: PhotosphereScene, fromPhotosphere: Photosphere, 
                fromHotspot: Hotspot, toPhotosphereData: PhotosphereData) {
        super(photosphereScene, fromPhotosphere, toPhotosphereData);
        this.photosphereScene = photosphereScene;
        this.fromHotspot = fromHotspot;
        this.bokehPass = new BokehPass(this.scene, this.camera, this.effectController)
    }

    override startTransition(callback?: (newPhotosphere: Photosphere) => void): void {
        this.duration = settings.duration;
        this.camera.transitioning = true;
        this.camera.enabled = false;

        this.startTransitionAsync(callback);
    }

    async startTransitionAsync(callback?: (newPhotosphere: Photosphere) => void): Promise<void> {
        this.toPhotosphere = await this.prepareDestination();
        const fromPhotosphereEndLocation: THREE.Vector3 = 
                this.toPhotosphere.position.clone().multiplyScalar(-1);
        let midpointReached = false;
        
        const self = this;
        // Animate origin sphere moving to end location
        gsap.to(this.fromPhotosphere.position, {
            x: fromPhotosphereEndLocation.x,
            y: fromPhotosphereEndLocation.y,
            z: fromPhotosphereEndLocation.z,
            duration: this.duration,
            onUpdate: function() {
                const progress = this['progress']();
                if (progress >= 0.5 && !midpointReached) {
                    self.clampCameraWithinLimits(self.toPhotosphereData.rotation?.limit);
                    midpointReached = true;
                }
            }
        });

        // Animate destination sphere moving to user location 
        gsap.to(this.toPhotosphere.position, {
            x: 0,
            y: 0,
            z: 0,
            duration: this.duration,
            onComplete: () => {
                this.toPhotosphere?.position.set(0,0,0);
                this.scene.remove(this.fromPhotosphere);
                console.log("TRANSITION COMPLETE");
                this.camera.transitioning = false;
                this.camera.enabled = true;
                if (callback) {
                   callback(this.toPhotosphere!); 
                }
            }
        });

        // Helper function to update the effect
        const updateEffect = () => {
            const effectOpts: any = this.bokehPass.uniforms as any;
            effectOpts.focus.value = this.effectController.focus; 
            effectOpts.aperture.value = this.effectController.aperture; 
            effectOpts.maxblur.value = this.effectController.maxBlur; 
        }

        // Animate depth of field blur
        this.photosphereScene.addPostprocessingPass(this.bokehPass);
        console.log("Starting blur animation with settings", 
                    settings.maxBlurRange.min, 
                    settings.maxBlurRange.max, 
                    settings.duration)
        gsap.fromTo(this.effectController, 
                    { maxBlur: settings.maxBlurRange.min }, 
                    { maxBlur: settings.maxBlurRange.max, 
                      duration: this.duration/2.0, 
                      yoyo: true, 
                      repeat: 1,
                      onUpdate: () => {
                        updateEffect();
                        settings.maxBlur = this.effectController.maxBlur;
                      },
                      onComplete: () => {
                        this.photosphereScene.removePostprocessingPass(this.bokehPass)
                      }
                    });
    }

    private async prepareDestination(): Promise<Photosphere> {
        // We are going to create the new photosphere so that it is tangent to the
        // current photoshere at a point along the hotspot azimuth.
        // Calculate the position of the tangent photosphere's center relative to the 
        // center of the first sphere (our world origin)
        // Radius should be set (defaulted in data service)
        const combinedRadius: number = this.fromPhotosphere.data.radius! + 
                                       this.toPhotosphereData.radius!; 
        let {theta, phi} = this.fromHotspot.data.position;
        theta = theta  + Math.PI/2;

        const toPhotosphereCenterX = combinedRadius * Math.sin(theta) * Math.cos(phi);
        const toPhotosphereCenterY = combinedRadius * Math.cos(theta);
        const toPhotosphereCenterZ = combinedRadius * Math.sin(theta) * Math.sin(phi);

        console.log("Destination sphere x, y, z", toPhotosphereCenterX, toPhotosphereCenterY, toPhotosphereCenterZ);

        // create the destination photosphere
        const toPhotosphere = new Photosphere(this.toPhotosphereData);
        await toPhotosphere.ready;
        this.scene.add(toPhotosphere);
        toPhotosphere.position.set(toPhotosphereCenterX, toPhotosphereCenterY, toPhotosphereCenterZ)
        console.log("Destination photosphere position", toPhotosphere.position);
        console.log("Destination photosphere", toPhotosphere);
        return toPhotosphere;
    }

    private clampCameraWithinLimits(limits?: MinMaxAzimuth) {
        console.log("destination photosphere limits", limits);
        if (!limits) {
            return;
        }

        // Have to convert value to theta which is Pi/2 less then the lat
        let clampedTheta = toSignedAngle(getClosestAngle(this.camera.lat - Math.PI/2, limits.min.theta, limits.max.theta));
        let clampedPhi = toSignedAngle(getClosestAngle(this.camera.lon, limits.min.phi, limits.max.phi));
        console.log("clampedTheta, clampedPhi", clampedTheta, clampedPhi);
        this.camera.lookAtAzimuth({ theta: clampedTheta, phi: clampedPhi })
    }
}

