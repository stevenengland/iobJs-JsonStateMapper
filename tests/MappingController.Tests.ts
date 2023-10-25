import {
  State,
  MappingController,
  StateMappingError,
  IobJsInterface,
  IobLoggerInterface,
  MappingSpec,
  JsonPathLibInterface,
  MappingResultContainer,
  FilterType,
} from '../src/JsonStateMapper';
import { mock, Mock } from 'ts-jest-mocker';
import { StateFactory } from './factories/StateFactory';
import { TargetMappingFactory } from './factories/TargetMappingFactory';
import { MappingItemFactory } from './factories/MappingItemFactory';
import { MappingSpecFactory } from './factories/MappingSpecFactory';

describe('MappingController', () => {
  let iobJsMock: Mock<IobJsInterface>;
  let iobLoggerMock: Mock<IobLoggerInterface>;
  let jsonPathMock: Mock<JsonPathLibInterface>;
  let sut: MappingController;

  beforeEach(() => {
    iobJsMock = mock<IobJsInterface>();
    iobLoggerMock = mock<IobLoggerInterface>();
    jsonPathMock = mock<JsonPathLibInterface>();
    sut = new MappingController(iobJsMock, iobLoggerMock, jsonPathMock);
  });

  describe('getMappingSpec', () => {
    it('should throw when invalid Datastructure was found', () => {
      // GIVEN
      const state = new State({ val: '{"test": false }' });

      // WHEN
      function when() {
        sut.getMappingSpec(state);
      }

      // THEN
      expect(when).toThrow(StateMappingError);
      expect(when).toThrow(/property missing/);
    });
    it('should throw when invalid JSON was found', () => {
      // GIVEN
      const state = new State({ val: '{"test" false }' });

      // WHEN
      function when() {
        sut.getMappingSpec(state);
      }

      // THEN
      expect(when).toThrow(StateMappingError);
      expect(when).toThrow(/Unexpected token/);
    });
    it('should throw when JSON parse fails with unknown error', () => {
      // GIVEN
      const state = new State({ val: '{"test" false }' });

      // WHEN
      function when() {
        sut.getMappingSpec(state);
      }

      // THEN
      expect(when).toThrow(StateMappingError);
      expect(when).toThrow(/Unexpected token/);
    });
    it('should return definition object', () => {
      // GIVEN
      const state = StateFactory.create();

      // WHEN
      const sud = sut.getMappingSpec(state) as MappingSpec;

      // THEN
      expect(sud.groupFilter).toContain('_filter');
    });
  });

  describe('getConfigStates', () => {
    it('should return states', () => {
      // GIVEN
      iobJsMock.getStates.mockReturnValueOnce(StateFactory.createMultiple(3));

      // WHEN
      const result = sut.getMappingSpecStates();

      // THEN
      expect(result.length).toBe(3);
    });
  });

  describe('getStatesbyFunction', () => {
    it('should return states', () => {
      // GIVEN
      iobJsMock.getStates.mockReturnValueOnce(StateFactory.createMultiple(3));

      // WHEN
      const result = sut.getMappingSpecStates();

      // THEN
      expect(result.length).toBe(3);
    });
  });

  describe('getMatchingSourceStates', () => {
    it('should return correct states', () => {
      // GIVEN
      const mappingItem = MappingItemFactory.createWithPrefixedSourceStateName(
        1,
        'id_',
      )[0];
      const states = StateFactory.createWithPrefixedId(3, 'alias.0.something.');
      // WHEN

      const result = sut.getMatchingSourceStates(
        mappingItem,
        states, //new Array<State>(), //StateFactory.ArrayOfStatesWithId(3),
      );

      // THEN
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('alias.0.something.id_0');
    });
  });
  describe('handleMappingResults', () => {
    it('should log debug message if mapping result contains success state', () => {
      // GIVEN
      const mappingResultContainer = new MappingResultContainer();
      mappingResultContainer.addResult(true, 'test success');

      // WHEN
      sut.handleMappingResults(mappingResultContainer);

      // THEN
      expect(iobLoggerMock.debug).toBeCalledTimes(1);
    });
    it('should log warning message if mapping result contains failed state', () => {
      // GIVEN
      const mappingResultContainer = new MappingResultContainer();
      mappingResultContainer.addResult(false, 'test fail');

      // WHEN
      sut.handleMappingResults(mappingResultContainer);

      // THEN
      expect(iobLoggerMock.warn).toBeCalledTimes(1);
    });
  });
  describe('applyTargetMappings', () => {
    it('should return error if val of source state is not a JSON doc', () => {
      // GIVEN
      const targetMappings = TargetMappingFactory.createMultiple(1);
      iobJsMock.getState.mockReturnValueOnce(
        StateFactory.createWithInvalidJsonAsVal(),
      );

      // WHEN
      const result = sut.applyTargetMappings('testid', targetMappings);

      // THEN
      expect(result.mappingResults.length).toBe(1);
      expect(result.mappingResults[0].success).toBeFalsy();
      expect(result.mappingResults[0].message).toContain('JSON document');
    });
    it('should return one negative result when source state value is no JSON', () => {
      // GIVEN
      iobJsMock.getState.mockReturnValue(
        StateFactory.createWithInvalidJsonAsVal(),
      );
      const targetMappings = TargetMappingFactory.createMultiple(1);

      // WHEN
      const results = sut.applyTargetMappings('test', targetMappings);

      // THEN
      expect(results.mappingResults.length).toBe(1);
      expect(results.mappingResults[0].success).toBeFalsy();
      expect(results.mappingResults[0].message).toContain('JSON');
    });
    it('should return error if target mappings state does not exist', () => {
      // GIVEN
      const targetMappings = TargetMappingFactory.createMultiple(1);
      iobJsMock.getState
        .mockReturnValueOnce(StateFactory.create())
        .mockReturnValueOnce(StateFactory.createWithNotExistingTrue());

      // WHEN
      const result = sut.applyTargetMappings('testid', targetMappings);

      // THEN
      expect(result.mappingResults.length).toBe(1);
      expect(result.mappingResults[0].success).toBeFalsy();
      expect(result.mappingResults[0].message).toContain('Target state');
    });
    it('should return error if JSON path for value did not match anything', () => {
      // GIVEN
      const targetMappings = TargetMappingFactory.createMultiple(1);
      iobJsMock.getState.mockReturnValue(StateFactory.create());
      jsonPathMock.getValues.mockReturnValueOnce([]);

      // WHEN
      const result = sut.applyTargetMappings('testid', targetMappings);

      // THEN
      expect(result.mappingResults.length).toBe(1);
      expect(result.mappingResults[0].success).toBeFalsy();
      expect(result.mappingResults[0].message).toContain('JSON Path for value');
    });
    it('should return error if JSON path for timestamp did not match anything', () => {
      // GIVEN
      const targetMappings = TargetMappingFactory.createMultiple(1);
      iobJsMock.getState.mockReturnValue(StateFactory.create());
      jsonPathMock.getValues
        .mockReturnValueOnce(['test'])
        .mockReturnValueOnce([]);

      // WHEN
      const result = sut.applyTargetMappings('testid', targetMappings);

      // THEN
      expect(result.mappingResults.length).toBe(1);
      expect(result.mappingResults[0].success).toBeFalsy();
      expect(result.mappingResults[0].message).toContain(
        'JSON Path for timestamp',
      );
    });
    it('should return error if JSON path value for timestamp is not convertable', () => {
      // GIVEN
      const targetMappings = TargetMappingFactory.createMultiple(1);
      iobJsMock.getState.mockReturnValue(StateFactory.create());
      jsonPathMock.getValues
        .mockReturnValueOnce(['test'])
        .mockReturnValueOnce(['test']);

      // WHEN
      const result = sut.applyTargetMappings('testid', targetMappings);

      // THEN
      expect(result.mappingResults.length).toBe(1);
      expect(result.mappingResults[0].success).toBeFalsy();
      expect(result.mappingResults[0].message).toContain(
        'timestamp is not valid.',
      );
    });
    it('should return success when timestamp is given', () => {
      // GIVEN
      const targetMappings = TargetMappingFactory.createMultiple(1);
      iobJsMock.getState.mockReturnValue(StateFactory.create());
      jsonPathMock.getValues
        .mockReturnValueOnce(['test'])
        .mockReturnValueOnce(['2023-10-20T11:00:00']);

      // WHEN
      const result = sut.applyTargetMappings('testid', targetMappings);

      // THEN
      expect(result.mappingResults.length).toBe(1);
      expect(result.mappingResults[0].success).toBeTruthy();
      expect(result.mappingResults[0].message).toContain('Mapped');
    });
    it('should return error if setState throws', () => {
      // GIVEN
      const targetMappings = TargetMappingFactory.createMultiple(1);
      iobJsMock.getState.mockReturnValue(StateFactory.create());
      iobJsMock.setState.mockImplementation(() => {
        throw new Error('TEST');
      });
      jsonPathMock.getValues
        .mockReturnValueOnce(['test'])
        .mockReturnValueOnce(['2023-10-20T11:00:00']);

      // WHEN
      const result = sut.applyTargetMappings('testid', targetMappings);

      // THEN
      expect(result.mappingResults.length).toBe(1);
      expect(result.mappingResults[0].success).toBeFalsy();
      expect(result.mappingResults[0].message).toContain('TEST');
    });
  });
  describe('AddSubscriptionsAndSchedules', () => {
    it('should subscribe', () => {
      // GIVEN
      const mappingSpec = MappingSpecFactory.createWithFiltertype(
        FilterType.Function,
      );
      const filteredStates = StateFactory.createMultiple(2);
      filteredStates[0].id = 'adapter.0.test_1';
      mappingSpec.mappingItems[0].sourceStateName = 'test_1';
      const mappingSpecState = StateFactory.createWithVal(
        JSON.stringify(mappingSpec),
      );
      iobJsMock.getStates
        .mockReturnValueOnce([mappingSpecState])
        .mockReturnValueOnce(filteredStates);
      // WHEN
      sut.AddSubscriptionsAndSchedules();
      // THEN
      expect(iobJsMock.subscribe).toBeCalledWith(
        'adapter.0.test_1',
        expect.anything(),
        expect.any(Function),
        expect.any(Function),
      );
      expect(iobJsMock.subscribe).toBeCalledTimes(1);
    });
    it('should not subscribe if no source state matches the filter criteria', () => {
      // GIVEN
      const mappingSpecState = StateFactory.createWithVal(
        JSON.stringify(
          MappingSpecFactory.createWithFiltertype(FilterType.Function),
        ),
      );
      iobJsMock.getStates
        .mockReturnValueOnce([mappingSpecState])
        .mockReturnValueOnce(StateFactory.createMultiple(2));
      // WHEN
      sut.AddSubscriptionsAndSchedules();
      // THEN
      expect(iobJsMock.subscribe).toBeCalledTimes(0);
    });
    it('should handle errors safely', () => {
      // GIVEN
      const invalidMappingSpec = MappingSpecFactory.create();
      invalidMappingSpec.filterType = FilterType.String; // Filter type not implemented yet;
      const invalidState = StateFactory.create();
      invalidState.val = JSON.stringify(invalidMappingSpec);
      iobJsMock.getStates.mockReturnValueOnce([invalidState]);
      // WHEN
      sut.AddSubscriptionsAndSchedules();

      // THEN
      expect(iobLoggerMock.error).toBeCalledTimes(1);
    });
  });
});
