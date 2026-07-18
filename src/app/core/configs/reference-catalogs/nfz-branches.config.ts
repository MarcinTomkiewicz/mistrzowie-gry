import { INfzBranchCatalog } from '../../interfaces/i-nfz-branch';

export const NFZ_BRANCH_CATALOG = {
  metadata: {
    sources: [
      'https://www.nfz.gov.pl/o-nfz/struktura-nfz/identyfikatory-oddzialow-wojewodzkich-nfz/',
      'https://www.nfz.gov.pl/kontakt/oddzialy-nfz/',
    ],
    verifiedAt: '2026-07-17',
    catalogVersion: '1.0.0',
  },
  branches: [
    {
      code: '01',
      voivodeshipName: 'dolnośląskie',
      officialName: 'Dolnośląski Oddział Narodowego Funduszu Zdrowia we Wrocławiu',
      seat: 'Wrocław',
    },
    {
      code: '02',
      voivodeshipName: 'kujawsko-pomorskie',
      officialName: 'Kujawsko-Pomorski Oddział Narodowego Funduszu Zdrowia w Bydgoszczy',
      seat: 'Bydgoszcz',
    },
    {
      code: '03',
      voivodeshipName: 'lubelskie',
      officialName: 'Lubelski Oddział Narodowego Funduszu Zdrowia w Lublinie',
      seat: 'Lublin',
    },
    {
      code: '04',
      voivodeshipName: 'lubuskie',
      officialName: 'Lubuski Oddział Narodowego Funduszu Zdrowia w Zielonej Górze',
      seat: 'Zielona Góra',
    },
    {
      code: '05',
      voivodeshipName: 'łódzkie',
      officialName: 'Łódzki Oddział Narodowego Funduszu Zdrowia w Łodzi',
      seat: 'Łódź',
    },
    {
      code: '06',
      voivodeshipName: 'małopolskie',
      officialName: 'Małopolski Oddział Narodowego Funduszu Zdrowia w Krakowie',
      seat: 'Kraków',
    },
    {
      code: '07',
      voivodeshipName: 'mazowieckie',
      officialName: 'Mazowiecki Oddział Narodowego Funduszu Zdrowia w Warszawie',
      seat: 'Warszawa',
    },
    {
      code: '08',
      voivodeshipName: 'opolskie',
      officialName: 'Opolski Oddział Narodowego Funduszu Zdrowia w Opolu',
      seat: 'Opole',
    },
    {
      code: '09',
      voivodeshipName: 'podkarpackie',
      officialName: 'Podkarpacki Oddział Narodowego Funduszu Zdrowia w Rzeszowie',
      seat: 'Rzeszów',
    },
    {
      code: '10',
      voivodeshipName: 'podlaskie',
      officialName: 'Podlaski Oddział Narodowego Funduszu Zdrowia w Białymstoku',
      seat: 'Białystok',
    },
    {
      code: '11',
      voivodeshipName: 'pomorskie',
      officialName: 'Pomorski Oddział Narodowego Funduszu Zdrowia w Gdańsku',
      seat: 'Gdańsk',
    },
    {
      code: '12',
      voivodeshipName: 'śląskie',
      officialName: 'Śląski Oddział Narodowego Funduszu Zdrowia w Katowicach',
      seat: 'Katowice',
    },
    {
      code: '13',
      voivodeshipName: 'świętokrzyskie',
      officialName: 'Świętokrzyski Oddział Narodowego Funduszu Zdrowia w Kielcach',
      seat: 'Kielce',
    },
    {
      code: '14',
      voivodeshipName: 'warmińsko-mazurskie',
      officialName: 'Warmińsko-Mazurski Oddział Narodowego Funduszu Zdrowia w Olsztynie',
      seat: 'Olsztyn',
    },
    {
      code: '15',
      voivodeshipName: 'wielkopolskie',
      officialName: 'Wielkopolski Oddział Narodowego Funduszu Zdrowia w Poznaniu',
      seat: 'Poznań',
    },
    {
      code: '16',
      voivodeshipName: 'zachodniopomorskie',
      officialName: 'Zachodniopomorski Oddział Narodowego Funduszu Zdrowia w Szczecinie',
      seat: 'Szczecin',
    },
  ],
} as const satisfies INfzBranchCatalog;
