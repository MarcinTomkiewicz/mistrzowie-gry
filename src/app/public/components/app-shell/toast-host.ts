import {
  Component,
  ViewEncapsulation,
  afterNextRender,
  output,
} from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [ToastModule],
  template: '<p-toast></p-toast>',
  styleUrl: './toast-host.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ToastHost {
  readonly ready = output<void>();

  constructor() {
    afterNextRender(() => {
      this.ready.emit();
    });
  }
}
