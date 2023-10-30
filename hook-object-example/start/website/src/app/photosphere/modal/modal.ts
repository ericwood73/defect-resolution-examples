import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { Azimuth, ModalData } from "../models/photosphere.model";
import { Vector2 } from "three";
import gsap from "gsap";

export default class Modal extends CSS2DObject {
    data: ModalData;
    hidden: boolean = true;

    constructor(position: Azimuth, div: HTMLDivElement, data: ModalData) {
        super(div);
        this.data = data;
        div.style.opacity = "0";
        this.center = new Vector2(0, 0);
        this.setPosition(position.theta, position.phi);
    }

    setPosition(theta: number, phi: number) {
        theta = theta  + Math.PI/2;
        var x = Math.sin(theta) * Math.cos(phi);
        var y = Math.cos(theta);
        var z = Math.sin(theta) * Math.sin(phi);

        this.position.set(x, y, z);
    }

    show(animated: boolean = true) {
        if(animated) {
            gsap.fromTo(this.element, {opacity: 0}, {opacity: 1, duration: 0.5, onComplete: () => {
                this.hidden = false;
            }})
        } else {
            this.element.style.opacity = "1";
        }
    }

    hide(complete: () => void, animated: boolean = true) {
        if(this.hidden) {
            complete()
            return;
        }

        if(animated) {
            gsap.fromTo(this.element, {opacity: 1}, {opacity: 0, duration: 0.5, onComplete: () => {
                this.hidden = true;
                complete();
            }})
        } else {
            this.element.style.opacity = "0";
            this.hidden = true;
            complete();
        }
    }
}