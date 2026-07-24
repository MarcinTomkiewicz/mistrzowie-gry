import { ICoworkerAccessContext } from '../../interfaces/i-coworker-access-context';
import {
  assertEdgeContract,
  readEdgeBoolean,
  readEdgeObject,
} from '../../utils/edge-contract';

const RESPONSE_KEYS = ['ok', 'access'] as const;
const ACCESS_KEYS = ['enabled'] as const;

export function parseCoworkerAccessContext(
  value: unknown,
  path: string,
): ICoworkerAccessContext {
  const response = readEdgeObject(value, path);
  assertExactKeys(response, path, RESPONSE_KEYS);
  assertEdgeContract(response['ok'] === true, `${path}.ok`, 'true');

  const accessPath = `${path}.access`;
  const access = readEdgeObject(response['access'], accessPath);
  assertExactKeys(access, accessPath, ACCESS_KEYS);

  return {
    enabled: readEdgeBoolean(access['enabled'], `${accessPath}.enabled`),
  };
}

function assertExactKeys(
  value: Readonly<Record<string, unknown>>,
  path: string,
  expectedKeys: readonly string[],
): void {
  const actualKeys = Object.keys(value);
  assertEdgeContract(
    actualKeys.length === expectedKeys.length &&
      actualKeys.every((key) => expectedKeys.includes(key)),
    path,
    `an object with exactly these fields: ${expectedKeys.join(', ')}`,
  );
}
