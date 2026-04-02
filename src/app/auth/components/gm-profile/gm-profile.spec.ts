import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TranslocoTestingModule } from '@jsverse/transloco';

import { Auth } from '../../../core/services/auth/auth';
import { IGmProfileWithRelations } from '../../../core/interfaces/i-gm-profile';
import { GmProfileFacade } from '../../../core/services/gm-profile/gm-profile';
import { Storage } from '../../../core/services/storage/storage';
import { UiToast } from '../../../core/services/ui-toast/ui-toast';
import { GmProfile } from './gm-profile';

describe('GmProfile', () => {
  let component: GmProfile;
  let fixture: ComponentFixture<GmProfile>;
  let facade: jasmine.SpyObj<GmProfileFacade>;
  let storage: jasmine.SpyObj<Storage>;

  const existingProfile: IGmProfileWithRelations = {
    id: 'user-1',
    experience: 5,
    description: 'Opis',
    image: 'profilePhotos/user-1/old.png',
    quote: 'Cytat',
    isPublic: true,
    createdAt: null,
    updatedAt: null,
    styles: [],
    languages: [],
  };

  beforeEach(async () => {
    facade = jasmine.createSpyObj<GmProfileFacade>('GmProfileFacade', [
      'getMyGmProfile',
      'getAvailableStyles',
      'getAvailableLanguages',
      'upsertMyGmProfile',
    ]);
    facade.getMyGmProfile.and.returnValue(of(existingProfile));
    facade.getAvailableStyles.and.returnValue(of([]));
    facade.getAvailableLanguages.and.returnValue(of([]));
    facade.upsertMyGmProfile.and.returnValue(
      of({
        ...existingProfile,
        image: null,
      }),
    );

    storage = jasmine.createSpyObj<Storage>('Storage', [
      'getPublicUrl',
      'uploadImage',
    ]);
    storage.getPublicUrl.and.returnValue('https://example.com/profile.png');
    storage.uploadImage.and.returnValue(
      of({
        bucket: 'images',
        path: 'profilePhotos/user-1/new.png',
        publicUrl: null,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [
        GmProfile,
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
            userId: () => 'user-1',
            displayName: () => 'Tester',
          },
        },
        {
          provide: GmProfileFacade,
          useValue: facade,
        },
        {
          provide: Storage,
          useValue: storage,
        },
        {
          provide: UiToast,
          useValue: jasmine.createSpyObj<UiToast>('UiToast', [
            'warn',
            'success',
            'danger',
          ]),
        },
      ],
    })
    .overrideComponent(GmProfile, {
      set: {
        template: '',
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(GmProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes the persisted storage path when replacing an existing image', () => {
    component.onImageValueChange(
      new File(['new image'], 'new.png', { type: 'image/png' }),
    );

    component['uploadSelectedImageIfNeeded']().subscribe();

    expect(storage.uploadImage).toHaveBeenCalledWith(
      jasmine.any(File),
      jasmine.objectContaining({
        currentPath: 'profilePhotos/user-1/old.png',
      }),
    );
    expect(component.storedImagePath()).toBe(
      'profilePhotos/user-1/new.png',
    );
  });
});
