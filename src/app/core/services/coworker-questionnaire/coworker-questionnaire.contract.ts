import {
  ICoworkerQuestionnaireCurrentDeclaration,
  ICoworkerQuestionnaireGetResponse,
  ICoworkerQuestionnaireSaveResponse,
  ICoworkerQuestionnaireSensitiveMetadata,
  ICoworkerQuestionnaireStatement,
  ICoworkerSensitiveFieldMetadata,
} from '../../interfaces/i-coworker-questionnaire';
import {
  assertEdgeContract,
  readEdgeBase64,
  readEdgeBoolean,
  readEdgeLiteral,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgeObject,
  readEdgePositiveInteger,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { parseCoworkerQuestionnaireReadPayload } from './coworker-questionnaire-payload.contract';

export function parseCoworkerQuestionnaireGetResponse(
  value: unknown,
): ICoworkerQuestionnaireGetResponse {
  const response = readEdgeObject(value, 'response');
  const configured = readEdgeBoolean(response['configured'], 'configured');
  const revision = readEdgeNullableInteger(response['revision'], 'revision');
  const complete = readEdgeBoolean(response['complete'], 'complete');
  const validationPassed = readEdgeBoolean(
    response['validationPassed'],
    'validationPassed',
  );
  const completedAt = readEdgeNullableTimestamp(
    response['completedAt'],
    'completedAt',
  );
  const updatedAt = readEdgeNullableTimestamp(response['updatedAt'], 'updatedAt');
  const data = response['data'] === null
    ? null
    : parseCoworkerQuestionnaireReadPayload(response['data']);
  const sensitive = parseSensitiveMetadata(response['sensitive']);
  const statement = parseStatement(response['statement'], 'statement');
  const currentDeclaration = response['currentDeclaration'] === null
    ? null
    : parseCurrentDeclaration(response['currentDeclaration']);

  validateLifecycle(
    complete,
    validationPassed,
    completedAt,
    currentDeclaration,
  );

  if (configured) {
    assertEdgeContract(
      revision !== null && revision > 0,
      'revision',
      'a positive integer',
    );
    assertEdgeContract(data !== null, 'data', 'an object');
    assertEdgeContract(updatedAt !== null, 'updatedAt', 'a timestamp');
    assertDeclarationRevision(currentDeclaration, revision);
  } else {
    assertEdgeContract(revision === null, 'revision', 'null');
    assertEdgeContract(!complete, 'complete', 'false');
    assertEdgeContract(data === null, 'data', 'null');
    assertEdgeContract(updatedAt === null, 'updatedAt', 'null');
    assertEdgeContract(
      !sensitive.pesel.configured &&
        !sensitive.identityDocumentNumber.configured &&
        !sensitive.bankAccount.configured,
      'sensitive',
      'unconfigured sensitive fields',
    );
  }

  return {
    configured,
    revision,
    complete,
    validationPassed,
    completedAt,
    updatedAt,
    data,
    sensitive,
    statement,
    currentDeclaration,
  };
}

export function parseCoworkerQuestionnaireSaveResponse(
  value: unknown,
): ICoworkerQuestionnaireSaveResponse {
  const response = readEdgeObject(value, 'response');
  const saved = readEdgeBoolean(response['saved'], 'saved');
  const revision = readEdgePositiveInteger(response['revision'], 'revision');
  const complete = readEdgeBoolean(response['complete'], 'complete');
  const validationPassed = readEdgeBoolean(
    response['validationPassed'],
    'validationPassed',
  );
  const completedAt = readEdgeNullableTimestamp(
    response['completedAt'],
    'completedAt',
  );
  const updatedAt = readEdgeTimestamp(response['updatedAt'], 'updatedAt');
  const sensitive = parseSensitiveMetadata(response['sensitive']);
  const statement = parseStatement(response['statement'], 'statement');
  const currentDeclaration = response['currentDeclaration'] === null
    ? null
    : parseCurrentDeclaration(response['currentDeclaration']);

  assertEdgeContract(saved, 'saved', 'true');
  validateLifecycle(
    complete,
    validationPassed,
    completedAt,
    currentDeclaration,
  );
  assertDeclarationRevision(currentDeclaration, revision);

  return {
    saved: true,
    revision,
    complete,
    validationPassed,
    completedAt,
    updatedAt,
    sensitive,
    statement,
    currentDeclaration,
  };
}

function parseStatement(
  value: unknown,
  path: string,
): ICoworkerQuestionnaireStatement {
  const statement = readEdgeObject(value, path);
  const parsed: ICoworkerQuestionnaireStatement = {
    statementKey: readEdgeLiteral(
      statement['statementKey'],
      `${path}.statementKey`,
      ['coworker.questionnaire.final-declaration'] as const,
    ),
    statementVersion: readEdgePositiveInteger(
      statement['statementVersion'],
      `${path}.statementVersion`,
    ),
    statementText: readEdgeString(
      statement['statementText'],
      `${path}.statementText`,
    ),
    statementSha256Base64: readEdgeBase64(
      statement['statementSha256Base64'],
      `${path}.statementSha256Base64`,
      32,
    ),
  };
  assertEdgeContract(
    parsed.statementText.trim() !== '',
    path,
    'a complete statement',
  );
  return parsed;
}

function parseCurrentDeclaration(
  value: unknown,
): ICoworkerQuestionnaireCurrentDeclaration {
  const path = 'currentDeclaration';
  const declaration = readEdgeObject(value, path);

  return {
    id: readEdgeUuid(declaration['id'], `${path}.id`),
    questionnaireRevision: readEdgePositiveInteger(
      declaration['questionnaireRevision'],
      `${path}.questionnaireRevision`,
    ),
    ...parseStatement(declaration, path),
    actorUserId: readEdgeUuid(
      declaration['actorUserId'],
      `${path}.actorUserId`,
    ),
    source: readEdgeLiteral(
      declaration['source'],
      `${path}.source`,
      ['web'] as const,
    ),
    acceptedAt: readEdgeTimestamp(
      declaration['acceptedAt'],
      `${path}.acceptedAt`,
    ),
  };
}

function parseSensitiveMetadata(
  value: unknown,
): ICoworkerQuestionnaireSensitiveMetadata {
  const sensitive = readEdgeObject(value, 'sensitive');

  return {
    pesel: parseSensitiveField(sensitive['pesel'], 'sensitive.pesel'),
    identityDocumentNumber: parseSensitiveField(
      sensitive['identityDocumentNumber'],
      'sensitive.identityDocumentNumber',
    ),
    bankAccount: parseSensitiveField(
      sensitive['bankAccount'],
      'sensitive.bankAccount',
    ),
  };
}

function parseSensitiveField(
  value: unknown,
  path: string,
): ICoworkerSensitiveFieldMetadata {
  const field = readEdgeObject(value, path);
  const configured = readEdgeBoolean(field['configured'], `${path}.configured`);
  const masked = readEdgeNullableString(field['masked'], `${path}.masked`);

  assertEdgeContract(
    configured ? masked !== null && masked !== '' : masked === null,
    `${path}.masked`,
    configured ? 'a non-empty string' : 'null',
  );
  return { configured, masked };
}

function validateLifecycle(
  complete: boolean,
  validationPassed: boolean,
  completedAt: string | null,
  currentDeclaration: ICoworkerQuestionnaireCurrentDeclaration | null,
): void {
  assertEdgeContract(
    validationPassed === complete,
    'validationPassed',
    'the same boolean value as complete',
  );
  assertEdgeContract(
    complete === (completedAt !== null),
    'completedAt',
    complete ? 'a timestamp' : 'null',
  );
  assertEdgeContract(
    complete === (currentDeclaration !== null),
    'currentDeclaration',
    complete ? 'an object' : 'null',
  );
}

function assertDeclarationRevision(
  declaration: ICoworkerQuestionnaireCurrentDeclaration | null,
  revision: number,
): void {
  assertEdgeContract(
    declaration === null || declaration.questionnaireRevision === revision,
    'currentDeclaration.questionnaireRevision',
    'the current questionnaire revision',
  );
}
