import {
  State,
  IobJsInterface,
  IobLoggerInterface,
  SelfChecker,
} from '../src/JsonStateMapper';
import { mock, Mock } from 'ts-jest-mocker';
import { StateFactory } from './factories/StateFactory';

describe('SelfChecker', () => {
  let iobJsMock: Mock<IobJsInterface>;
  let iobLoggerMock: Mock<IobLoggerInterface>;
  let sut: SelfChecker;
  beforeEach(() => {
    iobJsMock = mock<IobJsInterface>();
    iobLoggerMock = mock<IobLoggerInterface>();
    sut = new SelfChecker(iobJsMock, iobLoggerMock);
  });
  describe('check', () => {
    it('should return false if no app config node was found', () => {
      // GIVEN
      iobJsMock.getStates.mockReturnValueOnce(new Array<State>());

      // WHEN
      const result = sut.check();

      // THEN
      expect(result).toBeFalsy();
    });
  });
  describe('check', () => {
    it('should return true if app config node was found', () => {
      // GIVEN
      iobJsMock.getStates.mockReturnValueOnce(StateFactory.createMultiple(1));

      // WHEN
      const result = sut.check();

      // THEN
      expect(result).toBeTruthy();
    });
  });
});
