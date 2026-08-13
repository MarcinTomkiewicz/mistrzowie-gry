import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipPicker } from './chip-picker';

describe('ChipPicker', () => {
  let component: ChipPicker;
  let fixture: ComponentFixture<ChipPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipPicker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChipPicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
