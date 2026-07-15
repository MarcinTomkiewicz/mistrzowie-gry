import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { startWith } from 'rxjs';

import { Auth } from '../../../core/services/auth/auth';
import { SessionReservationStore } from '../../../core/stores/session-reservation/session-reservation.store';

@Injectable()
export class SessionReservationFormController {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(SessionReservationStore);

  readonly contactForm = this.fb.nonNullable.group({
    customerName: this.fb.nonNullable.control('', Validators.required),
    customerEmail: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
    ]),
    customerPhone: this.fb.nonNullable.control(''),
  });

  readonly gmExtraForm = this.fb.nonNullable.group({
    message: this.fb.nonNullable.control(''),
    createCharactersAtTable: this.fb.nonNullable.control(false),
    provideCharacterGuidelines: this.fb.nonNullable.control(false),
    characterGuidelines: this.fb.nonNullable.control(''),
    extraNotes: this.fb.nonNullable.control(''),
  });

  readonly playersCountControl = new FormControl<number | null>(null);
  readonly customServicesRequestControl = this.fb.nonNullable.control('');

  constructor() {
    this.contactForm.valueChanges
      .pipe(
        startWith(this.contactForm.getRawValue()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const value = this.contactForm.getRawValue();

        this.store.setContact({
          customerName: value.customerName,
          customerEmail: value.customerEmail.trim(),
          customerPhone: value.customerPhone.trim() || null,
        });
      });

    this.gmExtraForm.valueChanges
      .pipe(
        startWith(this.gmExtraForm.getRawValue()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const value = this.gmExtraForm.getRawValue();

        this.store.setGmExtraInfo({
          message: value.message.trim() || null,
          createCharactersAtTable: value.createCharactersAtTable,
          provideCharacterGuidelines: value.provideCharacterGuidelines,
          characterGuidelines: value.characterGuidelines.trim() || null,
          extraNotes: value.extraNotes.trim() || null,
        });
      });

    this.playersCountControl.valueChanges
      .pipe(
        startWith(this.playersCountControl.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.store.setPlayersCount(value));

    this.customServicesRequestControl.valueChanges
      .pipe(
        startWith(this.customServicesRequestControl.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) =>
        this.store.setCustomServicesRequest(value.trim() || null),
      );
  }

  prefillContactFromAuthenticatedUser(): void {
    const user = this.auth.user();

    this.contactForm.reset({
      customerName: this.auth.displayName(),
      customerEmail: user?.email ?? '',
      customerPhone: user?.phoneNumber ?? '',
    });
  }

  markAllAsTouched(): void {
    this.contactForm.markAllAsTouched();
    this.gmExtraForm.markAllAsTouched();
    this.playersCountControl.markAsTouched();
    this.customServicesRequestControl.markAsTouched();
  }

  resetAfterSuccessfulReservation(): void {
    this.gmExtraForm.reset({
      message: '',
      createCharactersAtTable: false,
      provideCharacterGuidelines: false,
      characterGuidelines: '',
      extraNotes: '',
    });
    this.playersCountControl.reset(null);
    this.customServicesRequestControl.reset('');
  }
}
