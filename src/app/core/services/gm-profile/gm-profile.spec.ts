import { TestBed } from '@angular/core/testing';

import { GmProfile } from './gm-profile';

describe('GmProfile', () => {
  let service: GmProfile;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GmProfile);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
