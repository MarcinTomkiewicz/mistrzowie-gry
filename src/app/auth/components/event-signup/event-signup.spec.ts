import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSignup } from './event-signup';

describe('EventSignup', () => {
  let component: EventSignup;
  let fixture: ComponentFixture<EventSignup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSignup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventSignup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
