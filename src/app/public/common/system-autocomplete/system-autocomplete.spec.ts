import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemAutocomplete } from './system-autocomplete';

describe('SystemAutocomplete', () => {
  let component: SystemAutocomplete;
  let fixture: ComponentFixture<SystemAutocomplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemAutocomplete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemAutocomplete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
