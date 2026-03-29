import { TestBed } from '@angular/core/testing';

import { EventSignup } from './event-signup';

describe('EventSignup', () => {
  let service: EventSignup;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventSignup);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
