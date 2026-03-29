import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSignupForm } from './event-signup-form';

describe('EventSignupForm', () => {
  let component: EventSignupForm;
  let fixture: ComponentFixture<EventSignupForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSignupForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventSignupForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
