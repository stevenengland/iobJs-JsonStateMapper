import { IobLogger } from '../src/JsonStateMapper';

describe('log', () => {
  let sut: IobLogger;

  beforeEach(() => {
    sut = new IobLogger();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should debug', () => {
    // GIVEN
    const mockMethod = jest.spyOn(globalThis, 'log');

    // WHEN
    sut.debug('debugtest');

    // THEN
    expect(mockMethod).toBeCalledWith(expect.anything(), 'debug');
  });
  it('should info', () => {
    // GIVEN
    const mockMethod = jest.spyOn(globalThis, 'log');

    // WHEN
    sut.info('debugtest');

    // THEN
    expect(mockMethod).toBeCalledWith(expect.anything(), 'info');
  });
  it('should warn', () => {
    // GIVEN
    const mockMethod = jest.spyOn(globalThis, 'log');

    // WHEN
    sut.warn('debugtest');

    // THEN
    expect(mockMethod).toBeCalledWith(expect.anything(), 'warn');
  });
  it('should error', () => {
    // GIVEN
    const mockMethod = jest.spyOn(globalThis, 'log');

    // WHEN
    sut.error('debugtest');

    // THEN
    expect(mockMethod).toBeCalledWith(expect.anything(), 'error');
  });
});
