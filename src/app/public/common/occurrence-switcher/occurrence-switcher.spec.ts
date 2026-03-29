import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OccurrenceSwitcher } from './occurrence-switcher';

describe('OccurrenceSwitcher', () => {
  let component: OccurrenceSwitcher;
  let fixture: ComponentFixture<OccurrenceSwitcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OccurrenceSwitcher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OccurrenceSwitcher);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
