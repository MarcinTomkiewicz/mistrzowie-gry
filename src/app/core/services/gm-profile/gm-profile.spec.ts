import { TestBed } from '@angular/core/testing';

import { GmProfileFacade } from '../../facades/gm-profile/gm-profile.facade';

describe('GmProfileFacade', () => {
  let service: GmProfileFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GmProfileFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
