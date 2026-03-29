import { TestBed } from '@angular/core/testing';

import { SessionRead } from './session-read';

describe('SessionRead', () => {
  let service: SessionRead;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionRead);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
