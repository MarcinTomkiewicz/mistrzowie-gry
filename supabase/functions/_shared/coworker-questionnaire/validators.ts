import { ISO_ALPHA_2_CODES } from "./country-codes.ts";
import {
  normalizeBankAccount as normalizeBankAccountValue,
} from "../../../../src/app/core/utils/bank-account.ts";

export function normalizePesel(value: string): string {
  return value.replace(/[ -]/g, "");
}

export function getPeselBirthDate(pesel: string): string | null {
  if (!/^\d{11}$/.test(pesel)) {
    return null;
  }

  const digits = [...pesel].map(Number);
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const checksum = (10 -
    weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) %
      10) % 10;
  if (checksum !== digits[10]) {
    return null;
  }

  const yearPart = Number(pesel.slice(0, 2));
  const encodedMonth = Number(pesel.slice(2, 4));
  const day = Number(pesel.slice(4, 6));
  const decoded = decodePeselMonth(encodedMonth);
  if (decoded === null) {
    return null;
  }

  const year = decoded.century + yearPart;
  if (!isValidDateParts(year, decoded.month, day)) {
    return null;
  }

  const month = String(decoded.month).padStart(2, "0");
  const normalizedDay = String(day).padStart(2, "0");
  return `${String(year).padStart(4, "0")}-${month}-${normalizedDay}`;
}

export function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match !== null &&
    isValidDateParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function isValidNip(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) {
    return false;
  }

  const digits = [...nip].map(Number);
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum = weights.reduce(
    (sum, weight, index) => sum + weight * digits[index],
    0,
  ) % 11;
  return checksum !== 10 && checksum === digits[9];
}

export function normalizeBankAccount(value: string): string | null {
  const canonical = normalizeBankAccountValue(value);
  if (!/^PL\d{26}$/.test(canonical)) {
    return null;
  }

  const rearranged = `${canonical.slice(4)}2521${canonical.slice(2, 4)}`;
  let remainder = 0;
  for (const digit of rearranged) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1 ? canonical : null;
}

export function isIsoCountryCode(value: string): boolean {
  return ISO_ALPHA_2_CODES.has(value);
}

export function containsControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return true;
    }
  }
  return false;
}

function decodePeselMonth(
  encodedMonth: number,
): { century: number; month: number } | null {
  const ranges = [
    { first: 1, last: 12, offset: 0, century: 1900 },
    { first: 21, last: 32, offset: 20, century: 2000 },
    { first: 41, last: 52, offset: 40, century: 2100 },
    { first: 61, last: 72, offset: 60, century: 2200 },
    { first: 81, last: 92, offset: 80, century: 1800 },
  ];
  const range = ranges.find(({ first, last }) =>
    encodedMonth >= first && encodedMonth <= last
  );
  return range === undefined
    ? null
    : { century: range.century, month: encodedMonth - range.offset };
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
