export const QUESTIONNAIRE_PDF_COPY = {
  title: "KWESTIONARIUSZ OSOBOWY ZLECENIOBIORCY",
  sections: {
    personal: "1. DANE DOTYCZĄCE OSOBY ZGŁASZANEJ DO ZUS",
    registeredAddress: "Adres zameldowania",
    correspondenceAddress:
      "Adres zamieszkania oraz adres do korespondencji jeżeli jest inny niż adres zameldowania",
    institutions: "2. DANE DO ROZLICZEŃ PUBLICZNO – PRAWNYCH",
    insurance: "3. UBEZPIECZENIA SPOŁECZNE",
    insuranceExclusions:
      "3.1. Podstawa wyłączenia z obowiązkowych ubezpieczeń społecznych:",
    compulsoryInsurance: "3.2. Obowiązkowe Ubezpieczenia Społeczne",
    declaration: "4. OŚWIADCZENIE ZLECENIOBIORCY",
  },
  signature: {
    placeAndDate: "Miejscowość, dnia",
    coworker: "podpis",
  },
  labels: {
    firstName: "Imię",
    lastName: "Nazwisko",
    maidenName: "Nazwisko rodowe",
    middleName: "Imię drugie",
    birthDate: "Data urodzenia",
    birthPlace: "Miejscowość",
    pesel: "PESEL",
    nip: "NIP",
    identityDocument: "Seria i nr dowodu osobistego",
    citizenship: "Obywatelstwo",
    phone: "Tel. kont.",
    street: "Ulica",
    houseNumber: "Nr domu",
    apartmentNumber: "Nr lokalu",
    postalCode: "Kod pocztowy",
    city: "Miejscowość",
    voivodeship: "Województwo",
    county: "Powiat",
    municipality: "Gmina",
    postOffice: "Poczta",
    country: "Kraj",
    taxOffice: "Nazwa Urzędu Skarbowego:",
    nfzBranch: "Nazwa Oddziału Narodowego Funduszu Zdrowia",
    otherEmployment:
      "Informuję, że jestem zatrudniony(a) na podstawie umowy o pracę u innego pracodawcy niż MISTRZOWIE GRY SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ",
    otherEmployerName: "Nazwa zakładu pracy",
    otherEmploymentAtLeastMinimumWage:
      "a moje wynagrodzenie z umowy o pracę jest równe lub większe niż kwota minimalnego wynagrodzenia.",
    studentUnder26:
      "Jestem studentem(ką) w wieku do ukończenia 26 lat lub uczniem/uczennicą szkoły ponadpodstawowej (nr leg. Szkolnej lub studenckiej)",
    schoolOrUniversityName: "Nazwa Szkoły/uczelni",
    otherMandateContract:
      "Świadczę usługi na podstawie INNEJ umowy zlecenia na rzecz INNEGO zleceniodawcy niż MISTRZOWIE GRY SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ",
    otherPrincipalName: "Nazwa innego zleceniodawcy",
    otherMandateContractSocialInsurance:
      "i odprowadzam już składkę ZUS z tytułu umowy zlecenia.",
    subjectToCompulsorySocialInsurance:
      "Nie spełniam żadnego z podanych wyżej warunków i tym samym podlegam obowiązkowym ubezpieczeniom społecznym",
    employmentOfficeAddress: "Dokładny adres Urzędu Pracy",
    bankAccount: "Wypłatę proszę przesłać na konto nr",
    bankName: "w banku",
  },
  statements: {
    voluntaryPensionDisabilityInsurance: {
      join:
        "I jednocześnie wnoszę o objęcie mnie dobrowolnym ubezpieczeniami społecznymi.",
      decline:
        "I jednocześnie nie wnoszę o objęcie mnie dobrowolnym ubezpieczeniami społecznymi.",
    },
    voluntarySicknessInsurance: {
      join:
        "A ponadto chcę ubezpieczyć się dobrowolnie ubezpieczeniem chorobowym.",
      decline:
        "A ponadto nie chcę ubezpieczyć się dobrowolnie ubezpieczeniem chorobowym.",
    },
    pensionOrDisabilityPensionRight: {
      yes: "- mam ustalone prawo do emerytury/renty",
      no: "- nie mam ustalone prawo do emerytury/renty",
    },
    disabilityDegree: {
      none: "- nie posiadam stopnia niepełnosprawności,",
      light: "- posiadam lekki stopień niepełnosprawności,",
      moderate: "- posiadam umiarkowany stopień niepełnosprawności,",
      severe: "- posiadam znaczny stopień niepełnosprawności,",
    },
    employmentOfficeRegistration: {
      yes:
        "- jestem zarejestrowany jako bezrobotny w Powiatowym Urzędzie Pracy,",
      no:
        "- nie jestem zarejestrowany jako bezrobotny w Powiatowym Urzędzie Pracy,",
    },
    finalDeclaration: {
      opening: "Oświadczam, iż:",
      confirmation:
        "Zgodność z prawdą powyższych danych potwierdzam własnoręcznym podpisem.",
    },
  },
  values: {
    empty: "Brak danych",
    yes: "Tak",
    no: "Nie",
    passport: "Paszport",
    otherDocument: "Inny dokument",
  },
} as const;
