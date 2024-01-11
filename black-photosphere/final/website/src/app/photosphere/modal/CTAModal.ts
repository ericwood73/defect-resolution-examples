import { Azimuth, CTAButton, HotspotAction, ModalData } from "../models/photosphere.model";
import Modal from "./modal";

export default class CTAModal extends Modal {
    
    constructor(position: Azimuth, data: ModalData, onClick: (action: HotspotAction) => void) {
        var div = document.createElement("div");
        div.id = `MODAL-${data.id}`;

        var innerDiv = document.createElement("div");
        innerDiv.className = "modal-inner-div";

        
        if(data.title) {
            var p = document.createElement("p");
            p.innerText = data.title;
            innerDiv.appendChild(p);
        }

        if(data.ctaButton) {
            var button = document.createElement("button");
            button.innerText = data.ctaButton.title;
            button.onclick = () => {
                if(this.hidden) return;
                
                console.log(`CTA ACTION: ${data.ctaButton?.action}`);
                onClick(data.ctaButton!.action);
            }
            innerDiv.appendChild(button);
        }

        if(data.cssText) {
            div.style.cssText = data.cssText;
        } else {
            innerDiv.style.cssText = "width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;";
            div.style.cssText = "max-width:250px;max-height:500px;background-color:white;padding:50px;"
        }

        div.appendChild(innerDiv);
        super(position, div, data);
    }
}