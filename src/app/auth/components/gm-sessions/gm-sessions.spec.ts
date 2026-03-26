import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GmSessions } from './gm-sessions';

describe('GmSessions', () => {
  let component: GmSessions;
  let fixture: ComponentFixture<GmSessions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GmSessions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GmSessions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
