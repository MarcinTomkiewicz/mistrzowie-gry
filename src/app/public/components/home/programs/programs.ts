import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IProgramCard } from '../../../../core/interfaces/home/i-program-card';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './programs.html',
  styleUrl: './programs.scss',
})
export class Programs {
  readonly programs: IProgramCard[] = [
    {
      title: 'Chaotyczne Czwartki',
      intro: 'Cotygodniowe wydarzenie dla tych, którzy chcą po prostu zagrać.',
      bullets: [
        'Wpadasz bez wcześniejszych ustaleń',
        'Losujemy stoły, ekipy i systemy',
        'One-shoty w różnych klimatach',
        'Format, który ułatwia poznanie ludzi',
        'Stały rytm: łatwiej wrócić i grać regularnie',
      ],
      ctaLabel: 'Sprawdź szczegóły',
      ctaPath: '/chaotic-thursdays',
    },
    {
      title: 'Dołącz do Drużyny',
      intro: 'Program dla osób, które chcą znaleźć ekipę i wejść w regularne granie.',
      bullets: [
        'Pomagamy dobrać preferencje i styl grania',
        'Łączymy w drużyny, które do siebie pasują',
        'Ułatwiamy start bez presji “znajomości zasad”',
        'Budujemy fundament pod długofalową kampanię',
        'Możliwość dopasowania prowadzącego i formatu',
      ],
      ctaLabel: 'Zobacz program',
      ctaPath: '/join',
    },
  ];
}
