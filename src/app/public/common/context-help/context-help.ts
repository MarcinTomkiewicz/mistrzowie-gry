import { Component, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-context-help',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  templateUrl: './context-help.html',
})
export class ContextHelp {
  readonly text = input.required<string>();
  readonly ariaLabel = input.required<string>();
  readonly position = input<'right' | 'left' | 'top' | 'bottom'>('top');
}
