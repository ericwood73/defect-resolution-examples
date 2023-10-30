import { Azimuth, ModalData } from "../models/photosphere.model";
import Modal from "./modal";

export default class TextModal extends Modal {

    constructor(position: Azimuth, data: ModalData) {
        var div = document.createElement("div");
        div.id = `MODAL-${data.id}`;
        if(data.title) {
            div.innerText = data.title;
        }

        if(data.cssText) {
            div.style.cssText = data.cssText;
        } else {
            div.style.cssText = "max-width:250px;padding:50px;background-color:white;text-align:center;";
        }

        super(position, div, data);
    }
}