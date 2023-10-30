import * as THREE from 'three';
import DeviceOrientationControls from './helpers/DeviceOrientationControls';
import gsap from 'gsap';
import { Power2 } from 'gsap';
import { Azimuth, HotspotData, MinMax, MinMaxAzimuth, Rotation } from './models/photosphere.model';
import { getDebugUI } from './helpers/debug-ui';

export default class PhotosphereCamera extends THREE.PerspectiveCamera {
    transitioning: boolean = false;
    enabled: boolean = true;
    animating: boolean = false;
    interacting: boolean = false;
    needsUpdate: boolean = false;
    motionControlsEnabled: boolean = false;
    motionControls?: DeviceOrientationControls;
    defaultFov: number = 75;
    limit?: MinMaxAzimuth;
    zoomLimits?: MinMax;

    // Mouse & Touch Parameters
    target: THREE.Vector3 = new THREE.Vector3();
    lon: number = Math.PI/2;
    lat: number = 0;
    onMouseDownX: number = 0;
    onMouseDownY: number = 0;
    onMouseDownLon: number = 0;
    onMouseDownLat: number = 0;


    // Momentum Parameters
    momentum: boolean = true;
    momentumTimeout: any
    momentum_tween: any;
    momentumX: number = 0;
    momentumStart: Date = new Date();
    momentum_config = {
        duration: 1, // seconds
        distance_factor: 0.1,
        timeout: 20, // milliseconds
    };


    gyroTarget: THREE.Object3D = new THREE.Object3D();
    gyroForward: THREE.Vector3 = new THREE.Vector3();

    constructor(fov: number, aspect: number, near: number, far: number) {
        super(fov, aspect, near, far)
        this.defaultFov = fov;

        this.setupInteractions();

        // #region For debugging only.  Remove in production.
        const gui = getDebugUI().addFolder('Camera');
        const deg2Rad = Math.PI/180;
        gui.add(this, "lon", -179 * deg2Rad, 180 * deg2Rad, deg2Rad).listen().disable;
        gui.add(this, "lat", 0, 180 * deg2Rad, deg2Rad).listen().disable;

        // #endregion
    }

    setRotation(rotation: Rotation) {
        this.enabled = !rotation.disabled;
        this.limit = rotation.limit;
        this.fov = this.defaultFov;
        this.updateProjectionMatrix();
        if(rotation.start) {
            this.lookAtAzimuth(rotation.start);
        }
    }

    setZoomLimits(zoomLimits?: MinMax) {
        this.zoomLimits = zoomLimits;

        if(this.zoomLimits) {
            this.fov = THREE.MathUtils.clamp(this.fov, this.zoomLimits.min, this.zoomLimits.max);
        }
    }

    setupInteractions() {
        document.addEventListener("mousedown", this.onStart.bind(this), false);
        document.addEventListener("mousemove", this.onMove.bind(this), false);
        document.addEventListener("mouseup", this.onEnd.bind(this), false);
        document.addEventListener("touchstart", this.onStart.bind(this), false);
        document.addEventListener("touchmove", this.onMove.bind(this), false);
        document.addEventListener("touchend", this.onEnd.bind(this), false);
        document.addEventListener("wheel", this.onScroll.bind(this), false);

        this.promptMotionControls();    
    }

    update(): void {
        if(!this.enabled && !this.transitioning) return;

        // Short circuit if user is not moving the camera and
        // it doesn't need updating (was moved by code)
        if (this.needsUpdate) {
            this.needsUpdate = false;
        } else if (!this.interacting) {
            return;
        }

        if(this.motionControlsEnabled && this.motionControls) {
            this.motionControls.update();

            this.gyroTarget.getWorldDirection(this.gyroForward);
            var spot = this.gyroForward.normalize();

            this.lon = Math.atan2(spot.z, spot.x);
            this.lat = Math.PI - Math.acos(spot.y);
        }

        this.lat = Math.min(Math.max(this.lat, 0.1), Math.PI - 0.1) //Dont allow the camera to flip over.

        if(this.limit) { //TODO: Need to handle not snapping from one limit to the other for the gyro.
            this.lat = Math.min(Math.max(this.lat, this.thetaToLat(this.limit.min.theta)), 
                    this.thetaToLat(this.limit.max.theta));
            this.lon = Math.min(Math.max(this.lon, this.limit.min.phi), this.limit.max.phi);
        }

        if (this.target) {
            this.target.x = Math.sin(this.lat) * Math.cos(this.lon);
            this.target.y = Math.cos(this.lat);
            this.target.z = Math.sin(this.lat) * Math.sin(this.lon);

            this.lookAt(this.target);
        }
    }

    lookAtHotspot(hotspot: HotspotData, animated: boolean = false) {
        if(animated) {
            this.animating = true;
            var at = this.lat;
            var on = this.lon;

            // allow updates
            this.interacting = true;

            // animate camera
            gsap.fromTo(this, {lat: at, lon: on}, {
                lat: this.thetaToLat(hotspot.position.theta), 
                lon: hotspot.position.phi, duration: 1, 
                onComplete: () => {
                    this.animating = false;
                    this.interacting = false;
                }
            })
        } else {
            this.lookAtAzimuth(hotspot.position);

            // Make sure the camera updates
            this.needsUpdate = true;
        }
    }

    lookAtAzimuth(azimuth: Azimuth) {
        this.lat = this.thetaToLat(azimuth.theta);
        this.lon = azimuth.phi;
        
        // Make sure the camera updates
        this.needsUpdate = true;
    }

    onStart(event: any): void {
        if(!this.enabled || this.animating) return;

        var clientX = this.getClientX(event);
        var clientY = this.getClientY(event);

        this.onMouseDownX = clientX;
        this.onMouseDownY = clientY;

        this.onMouseDownLon = this.lon;
        this.onMouseDownLat = this.lat;
        this.momentumX = clientX;
        this.momentumStart = new Date();

        this.interacting = true;

        if (this.momentum_tween) {
            this.momentum_tween.kill();
          }
    }

    onMove(event: any): void {
        if(!this.enabled || this.animating) return;

        if(this.interacting) {
            var clientX = this.getClientX(event);
            var clientY = this.getClientY(event);

            this.lon = (this.onMouseDownX - clientX) * 0.002 + this.onMouseDownLon;
            this.lat = (this.onMouseDownY - clientY) * 0.002 + this.onMouseDownLat;

            if(this.momentumTimeout) {
                clearTimeout(this.momentumTimeout)
            }

            if(this.momentum) {
                this.momentumTimeout = setTimeout(() => {
                    var momentumDiff = (this.momentumX - clientX) * 0.1;
                    if (!this.interacting) {
                        var now: Date = new Date();
                        var time: number = (now.valueOf() - this.momentumStart.valueOf()) * 0.02;
                        var speed = momentumDiff / time;
                        var acceleration = speed / time;
            
                        this.tweenMomentum(acceleration);
                    }
                }, this.momentum_config.timeout);
            }
        }
    }

    onEnd(event: any): void {
        if(!this.enabled || this.animating) return;

        this.interacting = false;
    }

    onScroll(event: any): void {
        if(!this.enabled || this.animating) return;
        console.log(this.fov);
        var fov = this.fov + event.deltaY * 0.05;
        if(this.zoomLimits) {
            this.fov = THREE.MathUtils.clamp(fov, this.zoomLimits.min, this.zoomLimits.max);
            
        } else {
            this.fov = THREE.MathUtils.clamp(fov, 30, this.defaultFov);
        }
        console.log(this.fov);
        this.updateProjectionMatrix();
    }

    tweenMomentum(x: number): void {
        this.momentum_tween = gsap.to(this, { lon: `+=${this.momentum_config.distance_factor * x}`, ease: Power2.easeOut, duration: this.momentum_config.duration })
    }

    getClientX(event: any): number {
        let x: number = -1;
        if (event) {
            if (typeof event.clientX !== "undefined") {
                x = event.clientX;
            } else if (typeof event.touches !== "undefined" && event.touches.length > 0 && event.touches[0]) {
                x = event.touches[0].clientX;
            }
        }

        return x === -1 ? 0 : x;
    }

    getClientY(event: any): number {
        let y: number = -1;
        if (event) {
            if (typeof event.clientY !== "undefined") {
                y = event.clientY;
            } else if (typeof event.touches !== "undefined" && event.touches.length > 0 && event.touches[0]) {
                y = event.touches[0].clientY;
            }
        }

        return y === -1 ? 0 : y;
    }

    promptMotionControls() {
        var dme = (DeviceMotionEvent as any)
        if(dme.requestPermission) {
            dme.requestPermission().then((permissionState: any) => {
                if (permissionState === "granted") {
                   this.permitMotionControls();
                }
            }).catch(console.error);
        }
    }

    permitMotionControls() {
        this.motionControlsEnabled = true;
        this.motionControls = new DeviceOrientationControls(this.gyroTarget);
    }

    thetaToLat(theta: number): number {
        return theta + Math.PI/2;
    }
}