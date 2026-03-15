import { TestBed } from '@angular/core/testing';

import { UiToast } from './ui-toast';

describe('UiToast', () => {
  let service: UiToast;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiToast);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
