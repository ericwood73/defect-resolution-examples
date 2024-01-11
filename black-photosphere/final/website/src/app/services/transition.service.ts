import { Injectable } from '@angular/core';
import Photosphere from '../photosphere/photospheres/photosphere';
import { PhotosphereData, Transition } from '../photosphere/models/photosphere.model';
import { DataService } from './data.service';
import { PhotosphereService } from './photosphere.service';
import Hotspot from '../photosphere/hotspots/hotspot';
import TransformTransition from '../photosphere/transitions/transform-transition';
import PhotosphereScene from '../photosphere/photosphere-scene';
import PhotosphereTransition from '../photosphere/transitions/photosphere-transition';

@Injectable({
  providedIn: 'root'
})
export class TransitionService {
  private transitions: {[transitionId: string]: Transition} = {};

  constructor(private photosphereSvc: PhotosphereService, private dataSvc: DataService) {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    this.dataSvc.transitions.subscribe(transitions => {
      this.transitions = transitions
    });

    this.photosphereSvc.currentPhotosphere.subscribe(photosphere => {
      if(photosphere) {
          this.preloadVideoTransistions(photosphere)
      }
    });
  }

  getTransition(originPhotosphereId: string, destinationPhotosphereId: string): Transition | null {
    const transitionId = `${originPhotosphereId}_${destinationPhotosphereId}`;
    return this.transitions[transitionId];
  }

  preloadVideoTransistions(photoshere: PhotosphereData) {

  }

  handleTransition(scene: PhotosphereScene, from: Photosphere, to: PhotosphereData, 
                   selectedHotspot?: Hotspot, 
                   onTransitionComplete?: (photosphere: Photosphere) => void) {
    const transition = this.getTransition(from.data.id, to.id);
    if (transition?.video) {

    } else if (selectedHotspot) {
      // A selected hotspot is required for transform transistions
      // If there is no selected hotspot, fall back to the default
      const _selectedHotspot: Hotspot = selectedHotspot as Hotspot;
      new TransformTransition(scene, from, selectedHotspot, to)
              .startTransition(onTransitionComplete);
    } else {
      new PhotosphereTransition(scene, from, to).startTransition(onTransitionComplete);
    }
  }
}