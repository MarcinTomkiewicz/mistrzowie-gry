import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { ToastHost } from './toast-host';

@Component({
  selector: 'app-app-shell',
  imports: [RouterOutlet, ConfirmPopupModule, Navbar, Footer, ToastHost],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {}
