import { Component, OnInit } from '@angular/core';
import { PhotosphereService } from 'src/app/services/photosphere.service';
import { Router } from '@angular/router';
import PhotosphereScene from 'src/app/photosphere/photosphere-scene';
import { TransitionService } from 'src/app/services/transition.service';

@Component({
  selector: 'app-photosphere',
  templateUrl: "./photosphere.component.html",
  styleUrls: [ "./photosphere.component.scss" ]
})
export class PhotosphereComponent implements OnInit {
  photosphereScene!: PhotosphereScene;

  constructor(private router: Router, private photosphereSvc: PhotosphereService, 
              private transitionSvc: TransitionService) {
  }

  ngOnInit(): void {
    var container = document.getElementById("container") as HTMLElement;
    this.photosphereScene = new PhotosphereScene(container, this.photosphereSvc, 
                                                 this.router, this.transitionSvc);
  }
}
