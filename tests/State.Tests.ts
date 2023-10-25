import { State, StateValueType } from '../src/JsonStateMapper';

describe('State', () => {
  describe('valueIsJson', () => {
    it.each([
      [false, 'true'],
      [true, '{"x":true}'],
      [true, '[1, false, null]'],
      [false, '-'], // Invalid JSON
    ])(
      'should return %s when %s is given',
      (expected: boolean, input: string) => {
        // GIVEN
        const state = new State({
          val: input,
        });
        // WHEN
        const result = state.valueIsJson();

        // THEN
        expect(result).toBe(expected);
      },
    );
  });
  describe('setTimeStamp', () => {
    it.each([
      [1697792400, '2023-10-20T11:00:00'],
      [1697792400, '2023-10-20 11:00:00'],
      [NaN, '2023-19-99 99:99:99'],
      [NaN, false],
      [1111, 1111],
    ])(
      'should return %s with state timestamp of %s when %s is given',
      (expected: number, input: StateValueType) => {
        // GIVEN
        const state = new State({
          val: input,
        });
        // WHEN
        state.setTimeStamp(input);

        // THEN
        expect(state.ts).toBe(expected);
      },
    );
  });
});
