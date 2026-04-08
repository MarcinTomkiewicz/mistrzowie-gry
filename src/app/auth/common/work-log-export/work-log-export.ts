import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { IUserWorkLogExportRow } from '../../../core/interfaces/i-work-log';

@Component({
  selector: 'app-work-log-export',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './work-log-export.html',
})
export class WorkLogExportComponent {
  readonly rows = input.required<readonly IUserWorkLogExportRow[]>();
  readonly fileBaseName = input.required<string>();
  readonly csvLabel = input.required<string>();
  readonly xlsLabel = input.required<string>();

  exportCsv(): void {
    const header = [
      'User ID',
      'Imie MG',
      'Nazwisko MG',
      'Suma godzin',
      'Daty Chaotycznych Czwartkow',
    ];
    const data = this.rows().map((row) => [
      row.userId,
      row.firstName,
      row.lastName,
      String(row.totalHours).replace('.', ','),
      row.chaoticThursdayDatesLabel,
    ]);

    this.downloadFile(
      `${this.fileBaseName()}.csv`,
      'text/csv;charset=utf-8;',
      [
        '\uFEFF',
        [header, ...data].map((row) => row.map(csvCell).join(';')).join('\r\n'),
      ],
    );
  }

  async exportXls(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const XLSX = await import('xlsx');
    const rows = [
      [
        'User ID',
        'Imie MG',
        'Nazwisko MG',
        'Suma godzin',
        'Daty Chaotycznych Czwartkow',
      ],
      ...this.rows().map((row) => [
        row.userId,
        row.firstName,
        row.lastName,
        row.totalHours,
        row.chaoticThursdayDatesLabel,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 40 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 32 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ewidencja');
    XLSX.writeFileXLSX(workbook, `${this.fileBaseName()}.xlsx`);
  }

  private downloadFile(
    fileName: string,
    mimeType: string,
    parts: BlobPart[],
  ): void {
    if (typeof document === 'undefined' || typeof URL === 'undefined') {
      return;
    }

    const blob = new Blob(parts, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

function csvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');

  return /[;"\n]/.test(value) ? `"${escaped}"` : escaped;
}
