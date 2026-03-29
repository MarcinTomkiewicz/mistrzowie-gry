import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventSlots } from './event-slots';

describe('EventSlots', () => {
  let component: EventSlots;
  let fixture: ComponentFixture<EventSlots>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventSlots]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventSlots);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
