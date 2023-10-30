import * as THREE from 'three';
import PhotosphereCamera from './photosphere-camera';
import Photosphere from './photospheres/photosphere';
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import HIHotspot from './hotspots/hotspot';
import { CTAButton, HotspotAction, HotspotActionType, HotspotData, ModalData, ModalType, PhotosphereData, TransitionType } from './models/photosphere.model';
import { PhotosphereService } from '../services/photosphere.service';
import { Router } from '@angular/router';
import PhotosphereTransition from './transitions/photosphere-transition';
import ZoomTransition from './transitions/zoom-transition';
import TransformTransition from './transitions/transform-transition';
import { EffectComposer, Pass } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import Modal from './modal/modal';
import Hotspot from './hotspots/hotspot';
import TextModal from './modal/TextModal';
import CTAModal from './modal/CTAModal';
import { TransitionService } from '../services/transition.service';

export default class PhotosphereScene {
    public scene!: THREE.Scene;
    public camera!: PhotosphereCamera;
    public renderer!: THREE.WebGLRenderer;
    public hotspotRenderer!: CSS2DRenderer;

    // router: Router
    // photosphereSvc: PhotosphereService
    photosphere?: Photosphere
    hotspots: HIHotspot[] = [];
    selectedHotspot?: Hotspot = undefined;
    modal?: Modal

    // Support for postprocessing
    private effectComposer?: EffectComposer;
    private renderPass?: RenderPass;
    private outputPass?: OutputPass;
    
    constructor(container: HTMLElement, private photosphereSvc: PhotosphereService, private router: Router, 
                private transitionSvc: TransitionService) {
        // this.photosphereSvc = photosphereSvc;
        // this.router = router;
        this.init(container);
    }

    private init(container: HTMLElement): void {
        let aspect = window.innerWidth / window.innerHeight;
        this.camera = new PhotosphereCamera(75, aspect, 0.1, 2000);
        this.scene = new THREE.Scene();

        this.setupRenderer(container);
        this.setupHotspotRenderer(container);
        this.setupSubscriptions();
        this.setupListeners();
        this.update();
    }

    setupSubscriptions() {
        this.photosphereSvc.currentPhotosphere.subscribe(photosphere => {
            if(photosphere) {
                this.loadPhotosphere(photosphere);
            }
        })

        this.photosphereSvc.currentHotspot.subscribe(hotspot => {
            if(hotspot) {
                this.focusHotspot(hotspot, true);
            }
        })

        this.photosphereSvc.currentModal.subscribe(modal => {
            if(modal) {
                this.openModal(modal);
            } else {
                this.modal?.removeFromParent();
            }
        })
    }

    setupListeners() {
        window.addEventListener("resize", this.resize.bind(this));
    }

    resize() {
        if(this.camera && this.renderer && this.hotspotRenderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.hotspotRenderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    setupRenderer(container: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement)
    }

    setupHotspotRenderer(container: HTMLElement) {
        this.hotspotRenderer = new CSS2DRenderer();
        this.hotspotRenderer.setSize(window.innerWidth, window.innerHeight);
        this.hotspotRenderer.domElement.style.position = "absolute";
        this.hotspotRenderer.domElement.style.top = "0px";
        this.hotspotRenderer.domElement.id = "hotspot_renderer";
        container.appendChild(this.hotspotRenderer.domElement);
    }

    loadPhotosphere(photosphereData: PhotosphereData) {
        if(this.photosphere) {
            if(this.photosphere.data.id != photosphereData.id) {
                this.clearHotspots();
                //this.handleTransition(TransitionType.Zoom, this.photosphere, photosphereData);
                this.handleTransition(TransitionType.Transform, this.photosphere, photosphereData);
            }
        } else {
            if(this.photosphere) {
                this.clearPhotosphere();
            }
            
            if(photosphereData) {
                this.photosphere = new Photosphere(photosphereData);
                this.scene.add(this.photosphere);
                if(photosphereData.rotation) {
                    this.camera.setRotation(photosphereData.rotation);
                }

                this.camera.setZoomLimits(photosphereData.zoom);
                this.loadHotspotsForPhotosphere(photosphereData);
            }
        }
    }

    focusHotspot(hotspot: HotspotData, animated: boolean = false) {
        this.camera.lookAtHotspot(hotspot, animated);
    }

    clearPhotosphere() {
        this.photosphere?.removeFromParent();
        this.clearHotspots();
    }

    clearHotspots() {
        for(var hotspot of this.hotspots) {
            hotspot.removeFromParent();
        }

        this.hotspots = []
    }

    loadHotspotsForPhotosphere(photosphere: PhotosphereData) {
        this.clearHotspots();

        for(var hotspot of photosphere.hotspots) {
            this.loadHotspot(hotspot);
        }
    }

    loadHotspot(hotspotData: HotspotData) {
        var hotspot = new Hotspot(hotspotData, (action => {
            this.handleHotspotAction(action, hotspot)
        }));
        this.hotspots.push(hotspot);
        this.scene.add(hotspot);
    }

    handleHotspotAction(action: HotspotAction, hotspot?: Hotspot) {
        switch(action.type) {
            case HotspotActionType.Photosphere: {
                if(action.value) {
                    this.selectedHotspot = hotspot;
                    this.router.navigate([action.value])
                }
                break;
            }
            case HotspotActionType.Modal: {
                if(this.modal && action.value == this.modal.data.id) {
                    this.modal.hidden ? this.modal.show() : this.modal.hide(()=>{});
                } else if(action.value && hotspot) {
                    this.router.navigate([`${this.photosphere?.data.id}/${hotspot.data.id}/${action.value}`])
                }
                break;
            }
            case HotspotActionType.InternalLink: {
                //TODO: Handle internal link action type
                break;
            }
            case HotspotActionType.ExternalLink: {
                window.open(action.value, '_blank');
                break;
            }
        }
    }

    openModal(modalData: ModalData) {
        if(this.modal && this.modal.parent && this.modal.data.id == modalData.id) {
            this.clearModal();
            return;
        }

        var hotspot = this.photosphereSvc.currentHotspot.value;
        if(hotspot) {
            this.clearModal();

            switch(modalData.type) {
                case ModalType.Text: {
                    this.modal = new TextModal(hotspot.position, modalData);
                    break;
                }
                case ModalType.CTA: {
                    this.modal = new CTAModal(hotspot.position, modalData, (action: HotspotAction) => {
                        this.handleHotspotAction(action);
                    });
                    
                    break;
                }
            }

            this.modal.show();
            this.scene.add(this.modal);   
        }
    }

    clearModal() {
        if(this.modal) {
            var m =  this.modal;
            m.hide(()=> {
                m.removeFromParent();
            });
        }
    }

    handleTransition(type: TransitionType, from: Photosphere, to: PhotosphereData) {
        switch(type) {
            case TransitionType.None: {
                new PhotosphereTransition(this, from, to).startTransition(this.onTransitionComplete.bind(this))
                break;
            }
            case TransitionType.Zoom: {
                new ZoomTransition(this, from, to).startTransition(this.onTransitionComplete.bind(this))
                break;
            }
            case TransitionType.Transform: {
                if (!this.selectedHotspot) {
                    // A selected hotspot is required for transfrom transistions
                    // If there is no selected hotspot, fall back to the default
                    new PhotosphereTransition(this, from, to).startTransition(this.onTransitionComplete.bind(this))
                    break;
                }
                const selectedHotspot: Hotspot = this.selectedHotspot as Hotspot;
                new TransformTransition(this, from, selectedHotspot, 
                                        to).startTransition(this.onTransitionComplete.bind(this))
                break;
            }
        }
    }

    onTransitionComplete(photosphere: Photosphere) {
        this.photosphere = photosphere;
        this.loadHotspotsForPhotosphere(this.photosphere.data);
        this.camera.setZoomLimits(this.photosphere.data.zoom);
        if(photosphere.data.rotation) {
            this.camera.setRotation(photosphere.data.rotation);
        }
    }

    addPostprocessingPass(pass: Pass) {
        if (pass) {
            if (!this.effectComposer) {
                this.effectComposer = new EffectComposer(this.renderer);
                this.renderPass = new RenderPass(this.scene, this.camera);
                this.effectComposer.addPass(this.renderPass);
                this.outputPass = new OutputPass();
                this.effectComposer.addPass(this.outputPass);
            }
            // Insert the added pass just before the output pass
            this.effectComposer!.insertPass(pass, this.effectComposer.passes.length - 1);
        }
    }

    removePostprocessingPass(pass: Pass) {
        if (pass) {
            this.effectComposer?.removePass(pass);
        }
    }

    update(): void {
        requestAnimationFrame(this.update.bind(this));

        this.camera.update();

        // Render using post processing effects if any are enabled (passes > 2, 
        // i.e. a more pass then the render and output pass)
        if (this.effectComposer && this.effectComposer.passes.length > 2) {
            this.effectComposer.render();
        } else {
           this.renderer.render(this.scene, this.camera); 
        }
        
        this.hotspotRenderer.render(this.scene, this.camera);
    }
}