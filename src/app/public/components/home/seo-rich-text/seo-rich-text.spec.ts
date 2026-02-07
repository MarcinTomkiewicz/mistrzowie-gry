import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeoRichText } from './seo-rich-text';

describe('SeoRichText', () => {
  let component: SeoRichText;
  let fixture: ComponentFixture<SeoRichText>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeoRichText]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeoRichText);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
