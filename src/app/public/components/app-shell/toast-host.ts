import { Component, ViewEncapsulation } from '@angular/core';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [ToastModule],
  template: '<p-toast></p-toast>',
  styleUrl: './toast-host.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ToastHost {}
