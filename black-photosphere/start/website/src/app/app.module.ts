import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FullLogoPlaceholderComponent } from './pages/full-logo-placeholder/full-logo-placeholder.component';
import { PhotosphereComponent } from './pages/photosphere/photosphere.component';
import { LandingComponent } from './pages/landing/landing.component';

@NgModule({
  declarations: [
    AppComponent,
    FullLogoPlaceholderComponent,
    PhotosphereComponent,
    LandingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
