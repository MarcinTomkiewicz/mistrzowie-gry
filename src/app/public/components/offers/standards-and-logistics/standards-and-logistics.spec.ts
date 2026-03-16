import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardsAndLogistics } from './standards-and-logistics';

describe('StandardsAndLogistics', () => {
  let component: StandardsAndLogistics;
  let fixture: ComponentFixture<StandardsAndLogistics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardsAndLogistics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StandardsAndLogistics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
