import { IobJs } from '../src/JsonStateMapper';
import { StateBuilder } from './factories/StateFactory';
import { TargetMappingBuilder } from './factories/TargetMappingFactory';

describe('IobJs', () => {
  let sut: IobJs;

  beforeEach(() => {
    sut = new IobJs();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getState', () => {
    it('should return specific state', () => {
      // GIVEN
      const mockMethod = jest.spyOn(globalThis, 'getState');
      mockMethod.mockReturnValue({ val: 'test_val' } as iobJS.State);

      // WHEN
      const state = sut.getState('test');

      // THEN
      expect(state.id).toBe('test');
      expect(state.val).toBe('test_val');
      expect(state.exists).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return state with notExist property if returned iob State has this property', () => {
      // GIVEN
      const mockMethod = jest.spyOn(globalThis, 'getState');
      mockMethod.mockReturnValue({ notExist: true } as iobJS.AbsentState);

      // WHEN
      const state = sut.getState('test');

      // THEN
      expect(state.id).toBe('test');
      expect(state.exists).toBe(false);
    });
  });

  describe('getStates', () => {
    it('should return specific states', () => {
      // GIVEN
      const getStateMock = jest.spyOn(globalThis, 'getState');
      getStateMock
        .mockReturnValueOnce({ val: 'test_val1' } as iobJS.State)
        .mockReturnValueOnce({ val: 'test_val2' } as iobJS.State);
      const $Mock = jest.spyOn(globalThis, '$');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-expect-error
      $Mock.mockImplementationOnce(() => ['test_id1', 'test_id2']);

      // WHEN
      const states = sut.getStates('test');

      // THEN
      expect(states[0].val).toBe('test_val1');
      expect(states[1].val).toBe('test_val2');
    });
  });

  describe('setState', () => {
    it('should set specific state', () => {
      // GIVEN
      const stateBuilder = new StateBuilder();
      const mockMethod = jest.spyOn(globalThis, 'setState');

      // WHEN
      sut.setState(
        'test',
        stateBuilder.withId('test_id').withVal('test_val').build(),
      );

      // THEN
      expect(mockMethod).toBeCalledWith(
        expect.anything(),
        expect.objectContaining({
          ack: false,
          val: 'test_val',
        }),
      );
    });
  });

  describe('setState', () => {
    it('should set specific state with timestamp', () => {
      // GIVEN
      const stateBuilder = new StateBuilder();
      const mockMethod = jest.spyOn(globalThis, 'setState');

      // WHEN
      sut.setState('test', stateBuilder.withTs(1).build());

      // THEN
      expect(mockMethod).toBeCalledWith(
        expect.anything(),
        expect.objectContaining({
          ts: 1,
        }),
      );
    });
  });
  describe('subscribe', () => {
    it('should subscribe with correct parameters', () => {
      // GIVEN
      const builder = new TargetMappingBuilder();
      const mockMethod = jest.spyOn(globalThis, 'subscribe');
      const mappingFunction = jest.fn();
      const resultHandlerFunction = jest.fn();

      // WHEN
      sut.subscribe(
        'testid',
        [builder.withTargetStateName().build()],
        mappingFunction,
        resultHandlerFunction,
      );

      // THEN
      expect(mockMethod).toBeCalledWith('testid', expect.any(Function));
      //expect(mappingFunction).toBeCalledTimes(1);
      //expect(resultHandlerFunction).toBeCalledTimes(1);
    });
  });
});
