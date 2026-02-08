import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { AccordionModule } from 'primeng/accordion';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-chaotic-thursdays',
  standalone: true,
  imports: [RouterModule, ButtonModule, AccordionModule, TableModule],
  templateUrl: './chaotic-thursdays.html',
  styleUrl: './chaotic-thursdays.scss',
})
export class ChaoticThursdays {
  readonly highlights: { icon: string; title: string; text: string }[] = [
    {
      icon: 'pi pi-bolt',
      title: 'Jedno wejście',
      text: 'Wpadasz bez zobowiązań. Bez kampanii, bez deklaracji.',
    },
    {
      icon: 'pi pi-random',
      title: 'Losowanie',
      text: 'Stoły, MG i składy drużyn są losowane na miejscu.',
    },
    {
      icon: 'pi pi-users',
      title: 'Nowi ludzie',
      text: 'Format zaprojektowany pod poznawanie graczy.',
    },
    {
      icon: 'pi pi-star',
      title: 'Pełne doświadczenie',
      text: 'To jest sesja RPG, nie „demo” — tempo i domknięcie historii są częścią standardu.',
    },
  ];

  readonly steps: { time: string; title: string; text: string }[] = [
    {
      time: '17:00',
      title: 'Przyjście i zapisy',
      text: 'Zbieramy uczestników, odpowiadamy na pytania, integrujemy grupę.',
    },
    {
      time: '18:00',
      title: 'Losowanie',
      text: 'Losujemy MG, stoły i drużyny. Element napięcia i „show”.',
    },
    {
      time: '18:15',
      title: 'Start sesji',
      text: 'Krótkie wprowadzenie i ruszamy z grą. Zasady podawane w trakcie.',
    },
    {
      time: '21:15',
      title: 'Zamknięcie historii',
      text: 'Sesja ma wyraźne zakończenie — domykamy wątki i kończymy w punkt.',
    },
  ];

  readonly standards: { icon: string; title: string; text: string }[] = [
    {
      icon: 'pi pi-shield',
      title: 'Bezpieczna przestrzeń',
      text: 'Dbamy o komfort i granice — komunikacja i kultura stołu są elementem standardu.',
    },
    {
      icon: 'pi pi-clock',
      title: 'Tempo i struktura',
      text: 'Wydarzenie ma ramy, a sesja ma domknięcie — bez „urwanych” historii.',
    },
    {
      icon: 'pi pi-comments',
      title: 'Zasady bez presji',
      text: 'Jeśli nie znasz systemu — nic nie szkodzi. Tłumaczymy w trakcie i prowadzimy za rękę.',
    },
    {
      icon: 'pi pi-check',
      title: 'Spójny standard MG',
      text: 'Prowadzący działają w ramach wspólnych wytycznych, nie „jak komu wygodnie”.',
    },
  ];

  readonly faqs: { q: string; a: string }[] = [
    {
      q: 'Czy muszę znać zasady?',
      a: 'Nie. To format przygotowany również dla początkujących.',
    },
    {
      q: 'Czy to początek kampanii?',
      a: 'Nie. Każda sesja jest zamkniętym one-shotem.',
    },
    {
      q: 'Czy mogę przyjść sam/a?',
      a: 'Tak. To częsty scenariusz — właśnie po to jest losowanie.',
    },
  ];
}
