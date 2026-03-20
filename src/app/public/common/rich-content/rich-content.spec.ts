import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RichContent } from './rich-content';

describe('RichContent', () => {
  let component: RichContent;
  let fixture: ComponentFixture<RichContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RichContent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
