import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-character-counter',
  standalone: true,
  templateUrl: './character-counter.html',
})
export class CharacterCounter {
  readonly value = input.required<string | null>();
  readonly limit = input.required<number>();

  protected readonly length = computed(() => this.value()?.length ?? 0);
  protected readonly isOverLimit = computed(
    () => this.length() > this.limit(),
  );
}
