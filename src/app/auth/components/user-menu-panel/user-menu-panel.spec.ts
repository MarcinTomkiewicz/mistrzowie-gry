import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';

import { Auth } from '../../../core/services/auth/auth';
import { UserMenuPanel } from './user-menu-panel';

describe('UserMenuPanel', () => {
  let component: UserMenuPanel;
  let fixture: ComponentFixture<UserMenuPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserMenuPanel,
        TranslocoTestingModule.forRoot({
          langs: { pl: {} },
          translocoConfig: {
            availableLangs: ['pl'],
            defaultLang: 'pl',
          },
        }),
      ],
      providers: [
        {
          provide: Auth,
          useValue: {
            displayName: () => 'Tester',
            user: () => ({
              id: 'user-1',
              appRole: 'admin',
            }),
            logout: () => ({
              subscribe: ({ next }: { next: () => void }) => next(),
            }),
          },
        },
      ],
    })
    .overrideComponent(UserMenuPanel, {
      set: {
        template: '',
      },
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
