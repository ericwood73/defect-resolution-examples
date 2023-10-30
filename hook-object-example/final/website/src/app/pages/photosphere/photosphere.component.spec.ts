import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotosphereComponent } from './photosphere.component';

describe('PhotosphereComponent', () => {
  let component: PhotosphereComponent;
  let fixture: ComponentFixture<PhotosphereComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PhotosphereComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhotosphereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
