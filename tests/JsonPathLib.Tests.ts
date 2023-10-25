import { JsonPathLib } from '../src/JsonStateMapper';

describe('JsonPathLib', () => {
  const testobject = {
    key1: false,
    key2: 'string',
  };
  const testJson = JSON.stringify(testobject);
  let sut: JsonPathLib;

  beforeEach(() => {
    sut = new JsonPathLib();
  });
  describe('getValues', () => {
    it.each([
      [false, '$.key1', 0],
      ['string', '$.key2', 0],
      [undefined, '$.notexisting', 0],
      [[], '$.notexisting', -1],
    ])(
      'should return %s when %s is given',
      (expected: unknown, input: string, testIndex: number) => {
        // GIVEN
        // WHEN
        const result = sut.getValues(input, testJson);

        // THEN
        if (testIndex === -1) {
          expect(result).toStrictEqual(expected);
        } else {
          expect(result[testIndex]).toBe(expected);
        }
      },
    );
  });
});
