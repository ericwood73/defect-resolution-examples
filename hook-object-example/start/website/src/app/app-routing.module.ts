import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { PhotosphereComponent } from './pages/photosphere/photosphere.component';
import { FullLogoPlaceholderComponent } from './pages/full-logo-placeholder/full-logo-placeholder.component';

let routes: Routes = [
  { path: '', component: FullLogoPlaceholderComponent },
  { path: 'landing', component: LandingComponent, pathMatch: 'full' },
  { path: '**', component: PhotosphereComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
