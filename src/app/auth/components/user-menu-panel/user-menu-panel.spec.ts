import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMenuPanel } from './user-menu-panel';

describe('UserMenuPanel', () => {
  let component: UserMenuPanel;
  let fixture: ComponentFixture<UserMenuPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMenuPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserMenuPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
