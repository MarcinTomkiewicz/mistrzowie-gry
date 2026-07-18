import { CoworkerQuestionnaireForm } from '../../../../core/types/coworker-questionnaire-form';

const DATA_PATH_PREFIX = 'data.';
const SERVER_ERROR_KEY = 'server';
const FINAL_DECLARATION_PATH = 'finalDeclaration.accepted';

export function applyQuestionnaireFieldErrors(
  form: CoworkerQuestionnaireForm,
  fieldErrors: Readonly<Record<string, string>>,
): readonly string[] {
  const appliedPaths: string[] = [];

  for (const [fieldPath, message] of Object.entries(fieldErrors)) {
    const target = resolveQuestionnaireField(fieldPath);
    if (target === null) continue;

    const control = form.get(target.controlPath);
    if (control === null) continue;

    control.setErrors({ ...control.errors, [SERVER_ERROR_KEY]: message });
    control.markAsTouched();
    if (!appliedPaths.includes(target.focusPath)) {
      appliedPaths.push(target.focusPath);
    }
  }

  return appliedPaths;
}

export function clearQuestionnaireFieldErrors(
  form: CoworkerQuestionnaireForm,
  fieldPaths: readonly string[],
): void {
  for (const fieldPath of fieldPaths) {
    const target = resolveQuestionnaireField(fieldPath);
    if (target === null) continue;

    const control = form.get(target.controlPath);
    if (control === null || control.errors?.[SERVER_ERROR_KEY] === undefined) {
      continue;
    }

    const remainingErrors = { ...control.errors };
    delete remainingErrors[SERVER_ERROR_KEY];
    control.setErrors(
      Object.keys(remainingErrors).length > 0 ? remainingErrors : null,
    );
  }
}

export function focusFirstQuestionnaireField(
  host: HTMLElement,
  fieldPaths: readonly string[],
): void {
  const fields = host.querySelectorAll<HTMLElement>(
    '[data-questionnaire-field]',
  );

  for (const field of fields) {
    const fieldPath = field.getAttribute('data-questionnaire-field');
    if (fieldPath !== null && fieldPaths.includes(fieldPath)) {
      const focusTarget = field.querySelector<HTMLElement>(
        'input, button, [tabindex]',
      );
      (focusTarget ?? field).focus();
      return;
    }
  }
}

function resolveQuestionnaireField(
  fieldPath: string,
): { controlPath: string; focusPath: string } | null {
  if (fieldPath.startsWith('finalDeclaration.')) {
    return {
      controlPath: 'finalDeclarationAccepted',
      focusPath: FINAL_DECLARATION_PATH,
    };
  }

  const institutionMatch = fieldPath.match(
    /^data\.institutions\.(taxOffice|nfzBranch)(?:\..+)?$/,
  );
  if (institutionMatch !== null) {
    const controlPath = `institutions.${institutionMatch[1]}`;
    return { controlPath, focusPath: `${DATA_PATH_PREFIX}${controlPath}` };
  }

  const legacyCountryMatch = fieldPath.match(
    /^data\.(registeredAddress|correspondenceAddress)\.legacyCountryName$/,
  );
  if (legacyCountryMatch !== null) {
    const controlPath = `${legacyCountryMatch[1]}.countryCode`;
    return { controlPath, focusPath: `${DATA_PATH_PREFIX}${controlPath}` };
  }

  if (!fieldPath.startsWith(DATA_PATH_PREFIX)) return null;

  return {
    controlPath: fieldPath.slice(DATA_PATH_PREFIX.length),
    focusPath: fieldPath,
  };
}
