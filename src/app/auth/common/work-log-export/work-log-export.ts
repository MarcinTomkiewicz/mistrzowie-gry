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

  exportXls(): void {
    const header = [
      'User ID',
      'Imie MG',
      'Nazwisko MG',
      'Suma godzin',
      'Daty Chaotycznych Czwartkow',
    ];
    const rows = this.rows()
      .map(
        (row) => `
          <Row>
            <Cell><Data ss:Type="String">${escapeXml(row.userId)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(row.firstName)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(row.lastName)}</Data></Cell>
            <Cell><Data ss:Type="Number">${String(row.totalHours)}</Data></Cell>
            <Cell><Data ss:Type="String">${escapeXml(row.chaoticThursdayDatesLabel)}</Data></Cell>
          </Row>
        `,
      )
      .join('');

    const workbook = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40"
>
  <Worksheet ss:Name="Ewidencja">
    <Table>
      <Row>${header
        .map(
          (cell) =>
            `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`,
        )
        .join('')}</Row>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;

    this.downloadFile(
      `${this.fileBaseName()}.xls`,
      'application/vnd.ms-excel;charset=utf-8;',
      ['\uFEFF', workbook],
    );
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeXml(value: string): string {
  return escapeHtml(value);
}
