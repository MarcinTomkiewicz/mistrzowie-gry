import { TestBed } from '@angular/core/testing';

import { UiConfirm } from './ui-confirm';

describe('UiConfirm', () => {
  let service: UiConfirm;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiConfirm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
