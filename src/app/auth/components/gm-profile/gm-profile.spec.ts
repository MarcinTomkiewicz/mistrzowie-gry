import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GmProfile } from './gm-profile';



describe('GmProfile', () => {
  let component: GmProfile;
  let fixture: ComponentFixture<GmProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GmProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GmProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
