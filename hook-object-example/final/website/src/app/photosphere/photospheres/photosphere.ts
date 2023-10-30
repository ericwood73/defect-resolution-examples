import * as THREE from 'three';
import { PhotosphereData } from '../models/photosphere.model';
import PhotosphereTextureLoader from '../helpers/texture-loader';


export default class Photosphere extends THREE.Mesh {
    data: PhotosphereData;
    private _ready?: Promise<void>;

    constructor(photosphere: PhotosphereData) {
        photosphere.radius = photosphere.radius || 1000;
        console.log("In Photosphere constructor - radius = ", photosphere.radius);

        var geo = new THREE.SphereGeometry(photosphere.radius, 60, 40);
        geo.scale(-1, 1, 1);
        var mat = new THREE.MeshBasicMaterial({ transparent: false })
        super(geo, mat);

        this.data = photosphere;
        this.loadTexture();
        console.log("In Photosphere constructor - photosphere = ", this);
    }

    public get ready() {
        return this._ready;
    }

    loadTexture() {
        this._ready = new Promise<void>((resolve) => {
            PhotosphereTextureLoader.getInstance().getTextureForId(this.data.id).subscribe(tex => {
                if(tex) {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    const mat = this.material as THREE.MeshBasicMaterial;
                    mat.map = tex;
                    mat.needsUpdate = true;
                    resolve();
                }
            })
        });
    }
}