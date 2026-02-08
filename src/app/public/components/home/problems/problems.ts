import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IProblemCard } from '../../../../core/interfaces/home/i-problem-card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-problems',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './problems.html',
  styleUrl: './problems.scss',
})
export class Problems {
  readonly items: IProblemCard[] = [
    {
      title: 'Nie masz ekipy / nie wiesz od czego zacząć',
      text: 'Pomagamy wejść w RPG — dobieramy formę, ludzi i prowadzenie.',
      ctaLabel: 'Dołącz do Drużyny',
      ctaPath: '/join',
      icon: 'pi pi-users',
    },
    {
      title: 'Chcesz zagrać, ale brakuje prowadzącego',
      text: 'Zapewniamy standard prowadzenia i spójne doświadczenie sesji.',
      ctaLabel: 'Oferta indywidualna',
      ctaPath: '/offer/individual',
      icon: 'pi pi-user-edit',
    },
    {
      title: 'Szukasz regularnego grania bez układania wszystkiego od zera',
      text: 'Wydarzenia otwarte i formaty, które upraszczają start i dają ciągłość.',
      ctaLabel: 'Chaotyczne Czwartki',
      ctaPath: '/chaotic-thursdays',
      icon: 'pi pi-calendar',
    },
    {
      title: 'Potrzebujesz rozwiązania dla grupy / organizacji',
      text: 'Projektujemy scenariusze i formaty RPG pod cele zespołu.',
      ctaLabel: 'Oferta dla firm',
      ctaPath: '/offer/business',
      icon: 'pi pi-building',
    },
  ];
}
