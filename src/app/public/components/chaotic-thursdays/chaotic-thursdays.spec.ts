import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChaoticThursdays } from './chaotic-thursdays';

describe('ChaoticThursdays', () => {
  let component: ChaoticThursdays;
  let fixture: ComponentFixture<ChaoticThursdays>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChaoticThursdays]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChaoticThursdays);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
