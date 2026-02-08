import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { Seo } from '../../../core/services/seo/seo';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements OnInit {
  private readonly seo = inject(Seo);

  ngOnInit(): void {
    this.seo.apply({
      title: 'O nas',
      description:
        'Mistrzowie Gry to zespół, który projektuje i prowadzi doświadczenia RPG. Stawiamy na standardy, profesjonalizm i bezpieczeństwo współpracy.',
    });
  }
}
