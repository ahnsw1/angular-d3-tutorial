import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Char1Component } from './char1.component';

describe('Char1Component', () => {
  let component: Char1Component;
  let fixture: ComponentFixture<Char1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Char1Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Char1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
