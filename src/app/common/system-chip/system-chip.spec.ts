import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SystemChip } from './system-chip';

describe('SystemChip', () => {
  let component: SystemChip;
  let fixture: ComponentFixture<SystemChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SystemChip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SystemChip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
