import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GmRead } from '../../../core/services/gm-read/gm-read';
import { SessionDialog } from './session-dialog';

describe('SessionDialog', () => {
  let component: SessionDialog;
  let fixture: ComponentFixture<SessionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionDialog],
      providers: [
        {
          provide: GmRead,
          useValue: {
            getPublicProfileById: () => of(null),
            getDisplayName: () => '',
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
