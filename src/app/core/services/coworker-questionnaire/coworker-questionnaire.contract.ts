import {
  ICoworkerQuestionnaireGetResponse,
  ICoworkerQuestionnaireSaveResponse,
  ICoworkerQuestionnaireSensitiveMetadata,
  ICoworkerSensitiveFieldMetadata,
} from '../../interfaces/i-coworker-questionnaire';
import {
  assertEdgeContract,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeObject,
} from '../../utils/edge-contract';
import { parseCoworkerQuestionnaireReadPayload } from './coworker-questionnaire-payload.contract';

export function parseCoworkerQuestionnaireGetResponse(
  value: unknown,
): ICoworkerQuestionnaireGetResponse {
  const response = readEdgeObject(value, 'response');
  const configured = readEdgeBoolean(response['configured'], 'configured');
  const revision = readEdgeNullableInteger(response['revision'], 'revision');
  const complete = readEdgeBoolean(response['complete'], 'complete');
  const data = response['data'] === null
    ? null
    : parseCoworkerQuestionnaireReadPayload(response['data']);
  const sensitive = parseSensitiveMetadata(response['sensitive']);

  if (configured) {
    assertEdgeContract(
      revision !== null && revision > 0,
      'revision',
      'a positive integer',
    );
    assertEdgeContract(
      data !== null,
      'data',
      'an object for a configured questionnaire',
    );
  } else {
    assertEdgeContract(
      revision === null,
      'revision',
      'null for an unconfigured questionnaire',
    );
    assertEdgeContract(
      !complete,
      'complete',
      'false for an unconfigured questionnaire',
    );
    assertEdgeContract(
      data === null,
      'data',
      'null for an unconfigured questionnaire',
    );
    assertEdgeContract(
      !sensitive.pesel.configured &&
        !sensitive.identityDocumentNumber.configured &&
        !sensitive.bankAccount.configured,
      'sensitive',
      'unconfigured sensitive fields for an unconfigured questionnaire',
    );
  }

  return { configured, revision, complete, data, sensitive };
}

export function parseCoworkerQuestionnaireSaveResponse(
  value: unknown,
): ICoworkerQuestionnaireSaveResponse {
  const response = readEdgeObject(value, 'response');
  const saved = readEdgeBoolean(response['saved'], 'saved');
  const revision = readEdgeInteger(response['revision'], 'revision');
  const complete = readEdgeBoolean(response['complete'], 'complete');
  const validationPassed = readEdgeBoolean(
    response['validationPassed'],
    'validationPassed',
  );
  const sensitive = parseSensitiveMetadata(response['sensitive']);

  assertEdgeContract(saved, 'saved', 'true');
  assertEdgeContract(revision > 0, 'revision', 'a positive integer');
  assertEdgeContract(
    validationPassed === complete,
    'validationPassed',
    'the same boolean value as complete',
  );

  return { saved: true, revision, complete, validationPassed, sensitive };
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
