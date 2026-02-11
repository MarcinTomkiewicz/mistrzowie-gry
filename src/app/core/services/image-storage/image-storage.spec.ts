import { TestBed } from '@angular/core/testing';

import { ImageStorage } from './image-storage';

describe('ImageStorage', () => {
  let service: ImageStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
