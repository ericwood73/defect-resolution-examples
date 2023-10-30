import { BehaviorSubject } from 'rxjs';
import * as THREE from 'three'

export default class PhotosphereTextureLoader {
    private static instance: PhotosphereTextureLoader;
    private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
    private images: { [id: string]: BehaviorSubject<THREE.Texture|undefined> } = {}

    private constructor() {}

    public static getInstance(): PhotosphereTextureLoader {
        if(!PhotosphereTextureLoader.instance) {
            PhotosphereTextureLoader.instance = new PhotosphereTextureLoader();
        }

        return PhotosphereTextureLoader.instance;
    }

    public loadTextureForId(id: string, url: string) {

        this.textureLoader.loadAsync(url).then((texture) => {
            var bs = this.getTextureForId(id);
            bs.next(texture);  
        })
    }
    
    public getTextureForId(id: string): BehaviorSubject<THREE.Texture|undefined> {
        var bs = this.images[id];
        if(!bs) {
            bs = new BehaviorSubject<THREE.Texture|undefined>(undefined)
            this.images[id] = bs;
        }

        return bs;
    }
}