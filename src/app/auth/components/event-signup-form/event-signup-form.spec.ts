import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSignupFormComponent } from './event-signup-form';

describe('EventSignupFormComponent', () => {
  let component: EventSignupFormComponent;
  let fixture: ComponentFixture<EventSignupFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSignupFormComponent],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventSignupFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
