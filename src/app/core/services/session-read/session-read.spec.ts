import { TestBed } from '@angular/core/testing';

import { SessionRead } from '../../reads/sessions/session-read';

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
