const POLISH_BANK_ACCOUNT_PATTERN = /^\d{26}$/;
const BANK_ACCOUNT_GROUP_SIZE = 4;

export function normalizeBankAccount(value: string): string {
  const normalized = value.toUpperCase().replace(/[ -]/g, '');
  return POLISH_BANK_ACCOUNT_PATTERN.test(normalized)
    ? `PL${normalized}`
    : normalized;
}

export function formatBankAccount(value: string): string {
  const normalized = normalizeBankAccount(value);
  const groups: string[] = [];

  for (
    let index = 0;
    index < normalized.length;
    index += BANK_ACCOUNT_GROUP_SIZE
  ) {
    groups.push(normalized.slice(index, index + BANK_ACCOUNT_GROUP_SIZE));
  }

  return groups.join(' ');
}
