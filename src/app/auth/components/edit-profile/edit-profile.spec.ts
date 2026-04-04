import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';

import { Auth } from '../../../core/services/auth/auth';
import { Seo } from '../../../core/services/seo/seo';
import { IUser } from '../../../core/interfaces/i-user';
import { AppRole } from '../../../core/types/app-role';
import { EditProfile } from './edit-profile';

describe('EditProfile', () => {
  let component: EditProfile;
  let fixture: ComponentFixture<EditProfile>;
  let userState: WritableSignal<IUser | null>;
  let routeTab: string | null;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    routeTab = null;
    userState = signal(createUser('user'));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [
        EditProfile,
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
            user: userState,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'tab' ? routeTab : null),
              },
            },
          },
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: Seo,
          useValue: jasmine.createSpyObj<Seo>('Seo', ['apply']),
        },
      ],
    })
      .overrideComponent(EditProfile, {
        set: {
          template: '',
        },
      })
      .compileComponents();
  });

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(EditProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    await createComponent();

    expect(component).toBeTruthy();
  });

  it('shows only the general profile tab for regular users', async () => {
    routeTab = 'gm-profile';
    userState.set(createUser('user'));

    await createComponent();

    expect(component.canSeeGmTabs()).toBeFalse();
    expect(component.tabs().map((tab) => tab.id)).toEqual(['profile']);
    expect(component.activeTab()).toBe('profile');
  });

  it('shows all edit-profile tabs for gm users and above', async () => {
    routeTab = 'gm-sessions';
    userState.set(createUser('gm'));

    await createComponent();

    expect(component.canSeeGmTabs()).toBeTrue();
    expect(component.tabs().map((tab) => tab.id)).toEqual([
      'profile',
      'gm-profile',
      'gm-sessions',
      'gm-availability',
    ]);
    expect(component.activeTab()).toBe('gm-sessions');
  });

  it('returns to the general profile tab when gm access is lost', async () => {
    userState.set(createUser('gm'));

    await createComponent();

    component.onTabChange('gm-availability');
    expect(component.activeTab()).toBe('gm-availability');

    userState.set(createUser('user'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeTab()).toBe('profile');
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: { tab: 'profile' },
        replaceUrl: true,
      }),
    );
  });
});

function createUser(appRole: AppRole): IUser {
  return {
    id: 'user-1',
    email: 'tester@example.com',
    appRole,
    firstName: 'Tester',
    phoneNumber: null,
    city: null,
    street: null,
    houseNumber: null,
    apartmentNumber: null,
    postalCode: null,
    age: null,
    shortDescription: null,
    longDescription: null,
    extendedDescription: null,
    nickname: null,
    useNickname: false,
    isTestUser: false,
    createdAt: null,
    updatedAt: null,
  };
}
