import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { EventGlobalDraftController } from './event-global-draft-controller';

@Component({
  selector: 'app-event-core-editor-shell',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  providers: [EventGlobalDraftController],
})
export class EventCoreEditorShell {}
