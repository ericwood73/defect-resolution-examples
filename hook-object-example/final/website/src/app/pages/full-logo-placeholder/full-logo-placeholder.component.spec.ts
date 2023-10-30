import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FullLogoPlaceholderComponent } from './full-logo-placeholder.component';

describe('FullLogoPlaceholderComponent', () => {
  let component: FullLogoPlaceholderComponent;
  let fixture: ComponentFixture<FullLogoPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FullLogoPlaceholderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FullLogoPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
