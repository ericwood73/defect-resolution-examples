import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { HotspotAction, HotspotData } from "../models/photosphere.model";

export default class Hotspot extends CSS2DObject {
    data: HotspotData;

    constructor(data: HotspotData, hotspotClicked: (action: HotspotAction) => void) {
        var div = document.createElement("div");
        div.id = "hotspot-1";
        div.innerText = data.label;
        if(data.innerHTML) {
            div.innerHTML = data.innerHTML;
        }
        div.style.cssText = data.cssText;
        
        div.addEventListener('click', () => {
            hotspotClicked(data.action);
        })
        super(div);
        this.data = data;

        this.setPosition(data.position.theta, data.position.phi);
    }

    setPosition(theta: number, phi: number) {
        theta = theta  + Math.PI/2;
        var x = Math.sin(theta) * Math.cos(phi);
        var y = Math.cos(theta);
        var z = Math.sin(theta) * Math.sin(phi);

        this.position.set(x, y, z);
    }
}