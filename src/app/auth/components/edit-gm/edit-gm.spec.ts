import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditGm } from './edit-gm';

describe('EditGm', () => {
  let component: EditGm;
  let fixture: ComponentFixture<EditGm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditGm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditGm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
