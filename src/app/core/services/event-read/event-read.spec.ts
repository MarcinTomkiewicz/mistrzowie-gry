import { TestBed } from '@angular/core/testing';

import { EventRead } from '../../reads/events/event-read';

describe('EventRead', () => {
  let service: EventRead;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventRead);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
