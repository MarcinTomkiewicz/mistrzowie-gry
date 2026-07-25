const FILENAME_SUFFIX = "-kwestionariusz-osobowy.pdf";
const MAX_FILENAME_LENGTH = 255;
const NAME_SEPARATOR = "-";
const MAX_NAME_PARTS_LENGTH = MAX_FILENAME_LENGTH - FILENAME_SUFFIX.length -
  NAME_SEPARATOR.length;
const BALANCED_NAME_PART_LENGTH = Math.floor(MAX_NAME_PARTS_LENGTH / 2);

export function buildQuestionnairePdfFilename(
  firstName: string,
  lastName: string,
): string {
  const firstNameSegment = toFilenameSegment(firstName);
  const lastNameSegment = toFilenameSegment(lastName);
  if (firstNameSegment === "" || lastNameSegment === "") {
    throw new Error("Questionnaire filename requires non-empty name segments.");
  }
  const [firstNamePart, lastNamePart] = fitNameParts(
    firstNameSegment,
    lastNameSegment,
  );

  return `${firstNamePart}${NAME_SEPARATOR}${lastNamePart}${FILENAME_SUFFIX}`;
}

function fitNameParts(
  firstName: string,
  lastName: string,
): readonly [string, string] {
  if (firstName.length + lastName.length <= MAX_NAME_PARTS_LENGTH) {
    return [firstName, lastName];
  }
  if (firstName.length <= BALANCED_NAME_PART_LENGTH) {
    return [
      firstName,
      truncateNamePart(
        lastName,
        MAX_NAME_PARTS_LENGTH - firstName.length,
      ),
    ];
  }
  if (lastName.length <= BALANCED_NAME_PART_LENGTH) {
    return [
      truncateNamePart(
        firstName,
        MAX_NAME_PARTS_LENGTH - lastName.length,
      ),
      lastName,
    ];
  }

  const remainingCharacter = MAX_NAME_PARTS_LENGTH -
    2 * BALANCED_NAME_PART_LENGTH;
  const firstNameLength = BALANCED_NAME_PART_LENGTH +
    (firstName.length >= lastName.length ? remainingCharacter : 0);
  return [
    truncateNamePart(firstName, firstNameLength),
    truncateNamePart(lastName, MAX_NAME_PARTS_LENGTH - firstNameLength),
  ];
}

function truncateNamePart(value: string, maxLength: number): string {
  return value.slice(0, maxLength).replace(/-+$/, "");
}

function toFilenameSegment(value: string): string {
  return value
    .replace(/[\u0141\u0142]/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
