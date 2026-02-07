import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Programs } from './programs';

describe('Programs', () => {
  let component: Programs;
  let fixture: ComponentFixture<Programs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Programs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Programs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
