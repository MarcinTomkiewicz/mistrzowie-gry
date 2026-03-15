import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { ConfirmPopupModule } from 'primeng/confirmpopup';

@Component({
  selector: 'app-app-shell',
  imports: [RouterOutlet, ToastModule, Navbar, Footer, ConfirmPopupModule],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {}
