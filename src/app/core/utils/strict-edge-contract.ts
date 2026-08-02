import {
  EdgeObjectReaderResult,
  EdgeReader,
  EdgeReaderMap,
} from '../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeObjectReader,
  readEdgeObject,
} from './edge-contract';

export function createStrictEdgeObjectReader<
  const TReaders extends EdgeReaderMap,
>(readers: TReaders): EdgeReader<EdgeObjectReaderResult<TReaders>> {
  const reader = createEdgeObjectReader(readers);
  const expectedKeys = Object.keys(readers);

  return (value, path) => {
    const source = readEdgeObject(value, path);
    const actualKeys = Object.keys(source);
    assertEdgeContract(
      actualKeys.length === expectedKeys.length &&
        actualKeys.every((key) => expectedKeys.includes(key)),
      path,
      `an object with exactly these fields: ${expectedKeys.join(', ')}`,
    );
    return reader(source, path);
  };
}
