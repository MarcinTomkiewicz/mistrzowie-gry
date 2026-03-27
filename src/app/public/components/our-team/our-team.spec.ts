import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OurTeam } from './our-team';

describe('OurTeam', () => {
  let component: OurTeam;
  let fixture: ComponentFixture<OurTeam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OurTeam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OurTeam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
