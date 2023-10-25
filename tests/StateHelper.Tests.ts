import { IobJsInterface, StateHelper } from '../src/JsonStateMapper';
import { mock, Mock } from 'ts-jest-mocker';
import { StateFactory } from './factories/StateFactory';

describe('StateHelper', () => {
  let iobJsMock: Mock<IobJsInterface>;

  let sut: StateHelper;
  beforeEach(() => {
    iobJsMock = mock<IobJsInterface>();

    sut = new StateHelper(iobJsMock);
  });
  describe('getStateName', () => {
    it.each([
      ['IPADDR', 'alias.0.sp_dachboden_switch.IPADDR'],
      ['IP_ADDR', 'alias.0.sp_dachboden_switch.IP_ADDR'],
    ])(
      'should return %s when %s is given',
      (expected: string, input: string) => {
        // GIVEN
        //iobJsMock.getStates.mockReturnValueOnce(new Array<State>());

        // WHEN
        const result = sut.getStateName(input);

        // THEN
        expect(result).toBe(expected);
      },
    );
  });
  describe('getStateParentId', () => {
    it.each([
      ['alias.0.sp_dachboden_switch', 'alias.0.sp_dachboden_switch.IPADDR'],
    ])(
      'should return %s when %s is given',
      (expected: string, input: string) => {
        // GIVEN

        // WHEN
        const result = sut.getStateParentId(input);

        // THEN
        expect(result).toBe(expected);
      },
    );
  });
  describe('getStateSiblingsIds', () => {
    it('should return siblings', () => {
      // GIVEN
      iobJsMock.getStates.mockReturnValueOnce(
        StateFactory.createWithPrefixedId(3),
      );

      // WHEN
      const result = sut.getStateSiblingsIds('test');

      // THEN
      expect(result[0]).toBe('id_0');
      expect(result[1]).toBe('id_1');
      expect(result[2]).toBe('id_2');
    });
  });
});
