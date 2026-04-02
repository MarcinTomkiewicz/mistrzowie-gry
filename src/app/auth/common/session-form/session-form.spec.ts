import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TranslocoTestingModule } from '@jsverse/transloco';

import { Auth } from '../../../core/services/auth/auth';
import { Storage } from '../../../core/services/storage/storage';

import { SessionForm } from './session-form';

describe('SessionForm', () => {
  let component: SessionForm;
  let fixture: ComponentFixture<SessionForm>;
  let storage: jasmine.SpyObj<Storage>;

  beforeEach(async () => {
    storage = jasmine.createSpyObj<Storage>('Storage', [
      'getPublicUrl',
      'uploadImage',
    ]);
    storage.getPublicUrl.and.returnValue('https://example.com/image.png');
    storage.uploadImage.and.returnValue(
      of({
        bucket: 'images',
        path: 'sessionTemplates/user-1/new.png',
        publicUrl: null,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [
        SessionForm,
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
          },
        },
        {
          provide: Storage,
          useValue: storage,
        },
      ],
    })
    .overrideComponent(SessionForm, {
      set: {
        template: '',
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes the persisted storage path when replacing an existing image', () => {
    fixture.componentRef.setInput('initial', {
      image: 'sessionTemplates/user-1/old.png',
    });
    fixture.detectChanges();

    component.onImageValueChange(
      new File(['new image'], 'new.png', { type: 'image/png' }),
    );

    component['uploadSelectedImageIfNeeded']().subscribe();

    expect(storage.uploadImage).toHaveBeenCalledWith(
      jasmine.any(File),
      jasmine.objectContaining({
        currentPath: 'sessionTemplates/user-1/old.png',
      }),
    );
  });
});
