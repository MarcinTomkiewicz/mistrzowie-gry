import {
  ComponentRef,
  Injectable,
  Type,
  ViewContainerRef,
} from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export type LazyComponentImport<TComponent extends object> = () => Promise<
  Type<TComponent>
>;

export interface LazyComponentMountOptions<TComponent extends object> {
  host: ViewContainerRef;
  load: LazyComponentImport<TComponent>;
  clearHost?: boolean;
  onMount?: (componentRef: ComponentRef<TComponent>) => void;
}

@Injectable({ providedIn: 'root' })
export class LazyComponentLoader {
  private readonly componentCache = new WeakMap<
    LazyComponentImport<object>,
    Type<object>
  >();

  load<TComponent extends object>(
    load: LazyComponentImport<TComponent>,
  ): Observable<Type<TComponent>> {
    const cached = this.componentCache.get(
      load as LazyComponentImport<object>,
    );

    if (cached) {
      return of(cached as Type<TComponent>);
    }

    return from(load()).pipe(
      tap((componentType) => {
        this.componentCache.set(
          load as LazyComponentImport<object>,
          componentType as Type<object>,
        );
      }),
    );
  }

  mount<TComponent extends object>(
    options: LazyComponentMountOptions<TComponent>,
  ): Observable<ComponentRef<TComponent>> {
    const { host, load, clearHost = true, onMount } = options;

    return this.load(load).pipe(
      map((componentType) => {
        if (clearHost) {
          host.clear();
        }

        const componentRef = host.createComponent(componentType);
        onMount?.(componentRef);

        return componentRef;
      }),
    );
  }
}
