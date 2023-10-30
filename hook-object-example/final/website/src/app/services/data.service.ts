import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import PhotosphereTextureLoader from '../photosphere/helpers/texture-loader';
import { ModalData, PhotosphereData, Transition } from '../photosphere/models/photosphere.model';
import RouteMap from '../models/route-map';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  photosphereData: BehaviorSubject<PhotosphereData[]> = new BehaviorSubject<PhotosphereData[]>([]);
  modalData: BehaviorSubject<ModalData[]> = new BehaviorSubject<ModalData[]>([]);
  routeMap: BehaviorSubject<{[route: string]: RouteMap}> = new BehaviorSubject<{[route: string]: RouteMap}>({})
  transitions: BehaviorSubject<{[transitionId: string]: Transition}> = new BehaviorSubject<{[transitionId: string]: Transition}>({})

  constructor(private http: HttpClient) {
  }

  loadData() {
    console.log("GETTING DATA");
    this.loadRouteMap();
    this.loadPhotosphereData();
    this.loadModalData();
  }

  loadPhotosphereData() {
    this.http.get<PhotosphereData[]>("./assets/data/photospheres.json").subscribe((photospheres) => {
      this.photosphereData.next(photospheres);

      for(var photosphere of photospheres) {
        photosphere.radius = photosphere.radius || 1000;
        PhotosphereTextureLoader.getInstance().loadTextureForId(photosphere.id, photosphere.url);
      }
    })
  }

  loadModalData() {
    this.http.get<ModalData[]>("./assets/data/modals.json").subscribe((modals) => {
      this.modalData.next(modals);
    })
  }

  loadRouteMap() {
    this.http.get<{[route: string]: RouteMap}>("./assets/data/routing-map.json").subscribe((routes) => {
      this.routeMap.next(routes);
    })
  }

  loadTransitions() {
    this.http.get<{[id: string]: Transition}>("./assets/data/transitions.json").subscribe((transitions) => {
      this.transitions.next(transitions);
    })
  }
}