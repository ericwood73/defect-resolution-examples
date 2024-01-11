import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HotspotData, ModalData, PhotosphereData } from '../photosphere/models/photosphere.model';
import { NavigationEnd, Router } from '@angular/router';
import { DataService } from './data.service';
import RouteMap from '../models/route-map';

@Injectable({
  providedIn: 'root'
})
export class PhotosphereService {
  currentPhotosphere: BehaviorSubject<PhotosphereData|undefined> = new BehaviorSubject<PhotosphereData|undefined>(undefined);
  currentHotspot: BehaviorSubject<HotspotData|undefined> = new BehaviorSubject<HotspotData|undefined>(undefined);
  currentModal: BehaviorSubject<ModalData|undefined> = new BehaviorSubject<ModalData|undefined>(undefined);

  private photosphereId?: string;
  private hotspotId?: string;
  private modalId?: string;
  private modalData: ModalData[] = [];
  private photospehreData: PhotosphereData[] = [];
  private routeMap: {[route: string]: RouteMap} = {};

  constructor(private router: Router, private dataSvc: DataService) {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {     
        this.handleRoute(event.url);
      }
    });

    this.dataSvc.photosphereData.subscribe(photosphereData => {
      this.photospehreData = photosphereData;
      this.updateCurrentData();
    })

    this.dataSvc.modalData.subscribe(modalData => {
      this.modalData = modalData;
      this.updateCurrentData();
    });

    this.dataSvc.routeMap.subscribe(routeMap => {
      this.routeMap = routeMap;
      this.checkForRoute(this.router.url);
      this.updateCurrentData();
    })
  }

  checkForRoute(url: string): RouteMap|undefined {
    url = this.cleanURL(url);
    var route = this.routeMap[url];
    if(route) {
      this.photosphereId = route.photosphere;
      this.hotspotId = route.hotspot;
      this.modalId = route.modal;
    }

    return route;
  }

  cleanURL(url: string): string {
    if(url.charAt(0) == '/') {
      url = url.slice(1, url.length)
    }

    var params = url.split('?')
    if(params.length > 0) {
      return params[0]
    }
    
    return "";
  }

  handleRoute(url: string) {
    var cleanURL = this.cleanURL(url);
    if(!this.checkForRoute(cleanURL)) {
      var parts = cleanURL.split('/')

      console.log(parts);

      this.photosphereId = parts[0];
      this.hotspotId = parts[1];
      this.modalId = parts[2];
    } else {
      this.photosphereId = undefined;
      this.hotspotId = undefined;
      this.modalId = undefined;
    }

    this.updateCurrentData();
  }

  photosphereForId(id: string|undefined): PhotosphereData|undefined {
    var photosphere = this.dataSvc.photosphereData.value.find(p => {
      return p.id == this.photosphereId;
    })

    return photosphere;
  }

  updateCurrentData() {

    //If we dont have a valid route default to the first photosphere.
    if(this.dataSvc.photosphereData.value.length > 0 && Object.keys(this.routeMap).length > 0 && !this.photosphereForId(this.photosphereId)) {
      this.router.navigate([this.dataSvc.photosphereData.value[0].id])
    } else {
      if(this.photosphereId || this.photosphereId == "0") {
        var photosphere = this.dataSvc.photosphereData.value.find(p => {
          return p.id == this.photosphereId;
        })

        this.currentPhotosphere.next(photosphere);

        if(photosphere && (this.hotspotId || this.hotspotId == "0")) {
          var hotspot = photosphere.hotspots.find(h => {
            return h.id == this.hotspotId;
          })

          this.currentHotspot.next(hotspot);
        }
      }


      var modal = undefined;

      if((this.modalId || this.modalId == "0") && this.modalData) {
        modal = this.modalData.find(m => {
          return m.id == this.modalId;
        })
      }

      this.currentModal.next(modal);
    }
  }
}