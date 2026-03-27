import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GmProfileDialog } from './gm-profile-dialog';

describe('GmProfileDialog', () => {
  let component: GmProfileDialog;
  let fixture: ComponentFixture<GmProfileDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GmProfileDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GmProfileDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
