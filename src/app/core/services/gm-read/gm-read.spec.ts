import { TestBed } from '@angular/core/testing';

import { GmRead } from './gm-read';

describe('GmRead', () => {
  let service: GmRead;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GmRead);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
