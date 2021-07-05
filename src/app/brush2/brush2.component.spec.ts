import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Brush2Component } from './brush2.component';

describe('Brush2Component', () => {
  let component: Brush2Component;
  let fixture: ComponentFixture<Brush2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Brush2Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Brush2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
