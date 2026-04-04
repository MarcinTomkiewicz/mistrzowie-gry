import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  AutoCompleteCompleteEvent,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';

import { ISystem } from '../../../core/interfaces/i-system';
import { normalizeText } from '../../../core/utils/normalize-text';

interface ISystemAutocompleteQuery {
  query: string;
  immediate: boolean;
}

@Component({
  selector: 'app-system-autocomplete',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AutoCompleteModule],
  templateUrl: './system-autocomplete.html',
  styleUrl: './system-autocomplete.scss',
})
export class SystemAutocomplete {
  private readonly destroyRef = inject(DestroyRef);
  private readonly query$ = new Subject<ISystemAutocompleteQuery>();

  readonly control = input.required<FormControl<string | null>>();
  readonly systems = input<readonly ISystem[]>([]);
  readonly inputId = input('');
  readonly appendTo = input<'body' | 'self'>('body');

  readonly systemSelected = output<ISystem | null>();
  readonly systemCleared = output<void>();

  readonly systemSearchControl = new FormControl<ISystem | null>(null);
  readonly systemSuggestions = signal<ISystem[]>([]);

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      const systems = this.getAllSystems();

      this.systemSuggestions.set(systems);
      this.syncSelectedSystem(control.getRawValue(), systems);

      const subscription = control.valueChanges.subscribe((value) => {
        this.syncSelectedSystem(value, this.getAllSystems());
      });

      onCleanup(() => subscription.unsubscribe());
    });

    this.query$
      .pipe(
        switchMap(({ query, immediate }) =>
          immediate
            ? timer(0).pipe(map(() => query))
            : timer(1500).pipe(map(() => query)),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((query) => {
        if (query.length < 3) {
          this.systemSuggestions.set(this.getAllSystems());
          return;
        }

        const matchedSystems = this.systems().filter((system) =>
          this.normalize(system.name).includes(query),
        );

        this.systemSuggestions.set(
          matchedSystems.length ? [...matchedSystems] : this.getAllSystems(),
        );
      });
  }

  onComplete(event: AutoCompleteCompleteEvent): void {
    const query = this.normalize(event.query);

    this.query$.next({
      query,
      immediate: query.length < 3,
    });
  }

  onDropdownClick(): void {
    this.query$.next({
      query: '',
      immediate: true,
    });
  }

  onSelect(event: AutoCompleteSelectEvent): void {
    const system = event.value as ISystem | null;
    this.systemSuggestions.set(this.getAllSystems());
    this.systemSelected.emit(system);
  }

  onClear(): void {
    this.query$.next({
      query: '',
      immediate: true,
    });

    this.systemSearchControl.setValue(null, { emitEvent: false });
    this.systemSuggestions.set(this.getAllSystems());
    this.systemCleared.emit();
  }

  private getAllSystems(): ISystem[] {
    return [...this.systems()];
  }

  private syncSelectedSystem(
    systemId: string | null,
    systems: readonly ISystem[],
  ): void {
    const selectedSystem = systemId
      ? systems.find((system) => system.id === systemId) ?? null
      : null;

    this.systemSearchControl.setValue(selectedSystem, { emitEvent: false });
  }

  private normalize(value: string | null | undefined): string {
    return normalizeText(value)?.toLocaleLowerCase('pl') ?? '';
  }
}
