import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({
  selector: '[mgLazyMountHost]',
  standalone: true,
})
export class LazyMountHost {
  readonly viewContainerRef = inject(ViewContainerRef);
}
