import { JSONPath } from 'jsonpath-plus';

const LIB_VERSION = '0.1-alpha';

//#region Test helper

function setTestIobFunctions() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  globalThis.getState = function (...args: any): any {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  globalThis.setState = function (...args: any): void {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  globalThis.subscribe = function (...args: any): any {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  globalThis.$ = function (...args: any): any {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  globalThis.log = function (...args: any): void {};
}

//#endregion Test helper

//#region System helper
export const nameof = <T>(name: Extract<keyof T, string>): string => name;
//#endregion System helper

//#region 3rd party integration
export interface JsonPathLibInterface {
  getValues(jsonPath: string, json: string): unknown[];
}

export class JsonPathLib implements JsonPathLibInterface {
  public getValues(jsonPath: string, json: string): unknown[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const jsonObject = JSON.parse(json);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const values = JSONPath({
      path: jsonPath,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      json: jsonObject,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return values;
  }
}
//#endregion 3rd party integration

//#region IOBroker helper
export interface IobJsInterface {
  getState(id: string): State;
  getStates(selector: string): Array<State>;
  setState(targetStateId: string, state: State): void;
  subscribe(
    sourceStateId: string,
    targetMappings: TargetMappingInterface[],
    mappingFunction: (
      sourceStateId: string,
      targetMappings: TargetMappingInterface[],
    ) => MappingResultContainer,
    resultHandlerFunction: (container: MappingResultContainer) => void,
  ): void;
}

export class IobJs implements IobJsInterface {
  public getState(id: string): State {
    const state = getState(id);
    const notExists = Object.prototype.hasOwnProperty.call(state, 'notExist');
    return new State({
      id: id,
      val: state.val as StateValueType,
      exists: !notExists,
    });
  }
  public getStates(selector: string): State[] {
    const resultStates: Array<State> = [];
    const stateIds = Array.prototype.slice.apply($(selector));
    stateIds.forEach((id) => {
      const state = this.getState(id as string);
      resultStates.push(state);
    });
    return resultStates;
  }

  public setState(targetStateId: string, state: State): void {
    if (typeof state.ts === 'undefined') {
      setState(targetStateId, { val: state.val, ack: state.ack });
    } else {
      setState(targetStateId, { val: state.val, ack: state.ack, ts: state.ts });
    }
  }

  public subscribe(
    sourceStateId: string,
    targetMappings: TargetMappingInterface[],
    mappingFunction: (
      sourceStateId: string,
      targetMappings: TargetMappingInterface[],
    ) => MappingResultContainer,
    resultHandlerFunction: (container: MappingResultContainer) => void,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    subscribe(sourceStateId, (obj) => {
      const results = mappingFunction(sourceStateId, targetMappings);
      resultHandlerFunction(results);
    });
  }
}

export interface IobLoggerInterface {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export class IobLogger implements IobLoggerInterface {
  public debug(message: string): void {
    log('# JSM: ' + message, 'debug');
  }
  public info(message: string): void {
    log('# JSM: ' + message, 'info');
  }
  public warn(message: string): void {
    log('# JSM: ' + message, 'warn');
  }
  public error(message: string): void {
    log('# JSM: ' + message, 'error');
  }
}

export type StateValueType = boolean | number | string | null;

export class State {
  public id!: string;
  public val: StateValueType = null;
  public ts?: number;
  public ack: boolean = false;
  public readonly exists: boolean = false;

  public constructor(init?: Partial<State>) {
    Object.assign(this, init);
  }

  public valueIsJson(): boolean {
    if (typeof this.val !== 'string') return false;
    try {
      const result = JSON.parse(this.val) as unknown;
      const type = Object.prototype.toString.call(result);
      return type === '[object Object]' || type === '[object Array]';
    } catch (err) {
      return false;
    }
  }

  public setTimeStamp(time: unknown): void {
    if (typeof time === 'string') {
      const date = Date.parse(time);
      this.ts = Math.floor(date / 1000);
    } else if (typeof time === 'number') {
      this.ts = time;
    } else {
      this.ts = NaN;
    }
  }
}

export class SelfChecker {
  private _iobJs!: IobJsInterface;
  private _iobLogger!: IobLoggerInterface;

  public constructor(iobJs: IobJsInterface, iobLogger: IobLoggerInterface) {
    this._iobJs = iobJs;
    this._iobLogger = iobLogger;
  }

  public check(): boolean {
    if (
      this._iobJs.getStates('state[id=0_userdata.0.JsonStateMapper.*]').length <
      1
    ) {
      this._iobLogger.warn('No suitable node for this application found.');
      return false;
    }
    this._iobLogger.debug('All self checks passed.');
    return true;
  }
}

//#endregion

//#region Core
export class StateMappingError extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, StateMappingError.prototype);
  }
}

export class MappingResult {
  public success!: boolean;
  public message!: string;
  public constructor(init?: Partial<MappingResult>) {
    Object.assign(this, init);
  }
}

export class MappingResultContainer {
  public mappingResults = new Array<MappingResult>();
  public addResult(success: boolean, message: string) {
    this.mappingResults.push(
      new MappingResult({ success: success, message: message }),
    );
  }
}

export class StateHelper {
  private _iobJs: IobJsInterface;
  // private _iobLogger!: IobLoggerInterface;

  public constructor(iobJs: IobJsInterface) {
    //, iobLogger: IobLoggerInterface) {
    this._iobJs = iobJs;
    //this._iobLogger = iobLogger;
  }

  public getStateName(stateId: string): string {
    const parts = stateId.split(/(.*)\./);
    return parts.length === 3 ? parts[2] : '';
  }

  public getStateParentId(stateId: string): string {
    const parts = stateId.split(/(.*)\./);
    return parts.length === 3 ? parts[1] : '';
  }

  public getStateSiblingsIds(stateId: string): string[] {
    const stateParent = this.getStateParentId(stateId);
    const stateSiblings = this._iobJs.getStates(
      'state[id=' + stateParent + '*]',
    );
    const siblingIds = stateSiblings.map((sibling) => sibling.id);
    return siblingIds;
  }
}

export enum FilterType {
  String = 'String',
  Function = 'Function',
}

export interface MappingSpecInterface {
  groupFilter: string;
  filterType: FilterType;
  mappingItems: Array<MappingItemInterface>;
}

export class MappingSpec implements MappingSpecInterface {
  public groupFilter!: string;
  public filterType!: FilterType;
  public mappingItems!: MappingItemInterface[];

  public constructor(init?: Partial<MappingSpec>) {
    Object.assign(this, init);
  }
}

export interface MappingItemInterface {
  sourceStateName: string;
  targetMappings: TargetMappingInterface[];
}

export class MappingItem implements MappingItemInterface {
  public sourceStateName!: string;
  public targetMappings!: TargetMappingInterface[];

  public constructor(init?: Partial<MappingItem>) {
    Object.assign(this, init);
  }
}

export interface TargetMappingInterface {
  targetStateName: string;
  jsonPathVal: string;
  jsonPathTimestamp?: string;
}

export class TargetMapping implements TargetMappingInterface {
  public targetStateName!: string;
  public jsonPathVal!: string;
  public jsonPathTimestamp?: string | undefined;
  public constructor(init?: Partial<TargetMapping>) {
    Object.assign(this, init);
  }
}

export class ValidationResult {
  public readonly isValid: boolean = false;
  public readonly message!: string;

  public constructor(result: boolean, message: string = '') {
    this.isValid = result;
    this.message = message;
  }
}

export class MappingSpecValidator {
  public static validate(spec: MappingSpecInterface): ValidationResult {
    let missingProp = '';

    // MappingSpecInterface
    if (!(nameof<MappingSpecInterface>('groupFilter') in spec)) {
      missingProp = nameof<MappingSpecInterface>('groupFilter');
    }
    if (!(nameof<MappingSpecInterface>('filterType') in spec)) {
      missingProp = nameof<MappingSpecInterface>('filterType');
    }
    if (!(nameof<MappingSpecInterface>('mappingItems') in spec)) {
      missingProp = nameof<MappingSpecInterface>('mappingItems');
    }
    if (missingProp !== '') {
      return new ValidationResult(false, missingProp + ' property missing');
    }

    // MappingItem
    for (let i = 0; i < spec.mappingItems.length; i++) {
      if (
        !(
          nameof<MappingItemInterface>('sourceStateName') in
          spec.mappingItems[i]
        )
      ) {
        missingProp = nameof<MappingItemInterface>('sourceStateName');
      }
      if (
        !(
          nameof<MappingItemInterface>('targetMappings') in spec.mappingItems[i]
        )
      ) {
        missingProp = nameof<MappingItemInterface>('targetMappings');
      }
      if (missingProp !== '') {
        return new ValidationResult(
          false,
          missingProp + ' property missing in mapping item',
        );
      }
      for (let j = 0; j < spec.mappingItems[i].targetMappings.length; j++) {
        if (
          !(
            nameof<TargetMappingInterface>('targetStateName') in
            spec.mappingItems[i].targetMappings[j]
          )
        ) {
          missingProp = nameof<TargetMappingInterface>('targetStateName');
        }
        if (
          !(
            nameof<TargetMappingInterface>('jsonPathVal') in
            spec.mappingItems[i].targetMappings[j]
          )
        ) {
          missingProp = nameof<TargetMappingInterface>('jsonPathVal');
        }
        if (missingProp !== '') {
          return new ValidationResult(
            false,
            missingProp + ' property missing in mapping item',
          );
        }
      }
    }

    return new ValidationResult(true);
  }
}

export class MappingController {
  private _iobJs!: IobJsInterface;
  private _iobLogger!: IobLoggerInterface;
  private _stateHelper: StateHelper;
  private _jsonPath!: JsonPathLibInterface;

  public constructor(
    iobJs: IobJsInterface,
    iobLogger: IobLoggerInterface,
    jsonPath: JsonPathLibInterface,
  ) {
    this._iobJs = iobJs;
    this._iobLogger = iobLogger;
    this._jsonPath = jsonPath;
    this._stateHelper = new StateHelper(this._iobJs);
  }

  public AddSubscriptionsAndSchedules(): void {
    const mappingSpecStates = this.getMappingSpecStates();
    mappingSpecStates.forEach((mappingSpecState) => {
      this._iobLogger.debug('Processing spec id: ' + mappingSpecState.id);
      this._iobLogger.debug(
        'Processing spec value: ' + mappingSpecState.val?.toString(),
      );
      this.handleMappingSpecState(mappingSpecState);
    });
  }

  private handleMappingSpecState(configState: State): void {
    try {
      // Extract the mapping specification
      const mappingSpec = this.getMappingSpec(configState);
      // Filter down the affected states for the mapping
      let filteredStates = new Array<State>();
      if (mappingSpec.filterType == FilterType.Function) {
        filteredStates = this.getStatesbyFunction(mappingSpec.groupFilter);
      } else {
        throw new StateMappingError('Not implemented yet');
      }

      this._iobLogger.debug('Processing filter: ' + mappingSpec.groupFilter);
      this._iobLogger.debug(
        'States affected by filter: ' +
          filteredStates.map((state) => state.id).join(' | '),
      );

      // Now process each mapping
      mappingSpec.mappingItems.forEach((mappingItem) => {
        // From the filtered list of affected states get those that hold JSON we want to process (source states)
        const matchingSourceStates = this.getMatchingSourceStates(
          mappingItem,
          filteredStates,
        );
        if (matchingSourceStates.length === 0) {
          this._iobLogger.debug('There is no state affected by filter given.');
          return;
        }
        this._iobLogger.debug(
          'Source states to be processed: ' +
            matchingSourceStates.map((state) => state.id).join(' | '),
        );
        matchingSourceStates.forEach((sourceState) => {
          this._iobLogger.debug(
            'Processing matching source State: ' + sourceState.id,
          );
          this._iobJs.subscribe(
            sourceState.id,
            mappingItem.targetMappings,
            this.applyTargetMappings.bind(this), // .bind to preserve context for later usage
            this.handleMappingResults.bind(this),
          );
          this._iobLogger.debug('Subscribed to: ' + sourceState.id);
        });
      });
    } catch (error) {
      this._iobLogger.error(
        (error as Error).name + ': ' + (error as Error).message,
      );
    }
  }

  public applyTargetMappings(
    sourceStateId: string,
    targetMappings: TargetMappingInterface[],
  ): MappingResultContainer {
    const results = new MappingResultContainer();
    // Get the most recent value without obj from subscribe
    const sourceState = this._iobJs.getState(sourceStateId);

    if (!sourceState.valueIsJson()) {
      results.addResult(
        false,
        'Value of ' + sourceState.id + ' is not a JSON document.',
      );
      return results;
    }

    targetMappings.forEach((targetMapping) => {
      const targetState = this._iobJs.getState(
        this._stateHelper.getStateParentId(sourceStateId) +
          '.' +
          targetMapping.targetStateName,
      );

      if (!targetState.exists) {
        results.addResult(
          false,
          'Target state ' + targetState.id + ' does not exist.',
        );
        return;
      }

      // Get and test target value
      const targetValues = this._jsonPath.getValues(
        targetMapping.jsonPathVal,
        sourceState.val as string,
      );
      if (targetValues.length === 0) {
        results.addResult(
          false,
          `JSON Path for value ${targetMapping.jsonPathVal} did not match anything.`,
        );
        return;
      }
      targetState.val = targetValues[0] as StateValueType;

      // Get and test target timestamp
      if (typeof targetMapping.jsonPathTimestamp !== 'undefined') {
        const targetTimeObjects = this._jsonPath.getValues(
          targetMapping.jsonPathTimestamp,
          sourceState.val as string,
        );

        if (targetTimeObjects.length === 0) {
          results.addResult(
            false,
            `JSON Path for timestamp ${targetMapping.jsonPathTimestamp} did not match anything.`,
          );
          return;
        }

        targetState.setTimeStamp(targetTimeObjects[0]);
        if (typeof targetState.ts !== 'undefined' && isNaN(targetState.ts)) {
          results.addResult(false, `Value for timestamp is not valid.`);
          return;
        }
      }

      // Set target ack
      targetState.ack = true;

      try {
        // Update target state values
        this._iobJs.setState(targetState.id, targetState);
        results.addResult(
          true,
          'Mapped: ' + targetState.id + ' -> ' + targetState.val,
        );
      } catch (error) {
        results.addResult(
          false,
          'An error occured: ' +
            (error as Error).name +
            ': ' +
            (error as Error).message,
        );
      }
    });

    return results;
  }

  public handleMappingResults(container: MappingResultContainer): void {
    container.mappingResults.forEach((result) => {
      if (result.success) {
        this._iobLogger.debug(result.message);
      } else {
        this._iobLogger.warn(result.message);
      }
    });
  }

  public getMatchingSourceStates(
    mappingItem: MappingItemInterface,
    states: State[],
  ): State[] {
    const sourceStateName = mappingItem.sourceStateName;
    const matchingStates = new Array<State>();
    states.forEach((state) => {
      const stateName = this._stateHelper.getStateName(state.id);
      if (stateName === sourceStateName) {
        matchingStates.push(state);
      }
    });
    return matchingStates;
  }

  public getStatesbyFunction(functionId: string): Array<State> {
    return this._iobJs.getStates('state(functions=' + functionId + ')');
  }
  public getMappingSpecStates(): Array<State> {
    return this._iobJs.getStates('state[id=0_userdata.0.JsonStateMapper.*]');
  }

  public getMappingSpec(configState: State): MappingSpecInterface {
    let sud = new MappingSpec();
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sud = JSON.parse(configState.val as string);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new StateMappingError(
          'Invalid state update definition (JSON) syntax: ' + error.message,
        );
      }
    }
    const valResult = MappingSpecValidator.validate(sud);
    if (!valResult.isValid) {
      throw new StateMappingError(
        'Validation of definition failed: ' + valResult.message,
      );
    }
    return sud;
  }
}

//#endregion Core

/* istanbul ignore next */
function runProduction() {
  const iobJs = new IobJs();
  const iobLogger = new IobLogger();
  const jsonPath = new JsonPathLib();
  const sc = new SelfChecker(iobJs, iobLogger);
  if (!sc.check()) {
    return;
  }
  const succ = new MappingController(iobJs, iobLogger, jsonPath);
  succ.AddSubscriptionsAndSchedules();
}

/* istanbul ignore next */
function main() {
  let envVars: NodeJS.ProcessEnv;

  if (typeof process === 'undefined') {
    // Preparation alternative 1: Code runs in IOBroker Javascript adapter that is not aware of "process"
    envVars = {
      NODE_ENV: 'PROD',
    };
  } else {
    // Preparation alternative 2: Code runs in native node environment that is aware of "process"
    envVars = process.env;
    setTestIobFunctions();
  }

  // Let's start the party
  // eslint-disable-next-line no-console
  console.log(
    '# JSM: Running version ' +
      LIB_VERSION +
      ' for environment ' +
      envVars.NODE_ENV,
  );
  if (envVars.NODE_ENV?.toLowerCase() !== 'test') {
    runProduction();
  }
}

// Entrypoint
main();
