import { TestBed } from '@angular/core/testing';

import { GmSessions } from './gm-sessions';

describe('GmSessions', () => {
  let service: GmSessions;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GmSessions);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
