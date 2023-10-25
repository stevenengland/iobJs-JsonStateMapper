import {
  MappingSpecValidator,
  MappingSpec,
  MappingSpecInterface,
  FilterType,
  nameof,
  MappingItemInterface,
  MappingItem,
  TargetMapping,
  TargetMappingInterface,
} from '../src/JsonStateMapper';
import { MappingItemFactory } from './factories/MappingItemFactory';
import { MappingSpecFactory } from './factories/MappingSpecFactory';

describe('MappingSpecValidator', () => {
  it('should return false when a invalid definition is given', () => {
    // GIVEN
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const definition: MappingSpecInterface = JSON.parse('{"test": false }');

    // WHEN
    const valResult = MappingSpecValidator.validate(definition);

    // THEN
    expect(valResult.isValid).toBeFalsy();
  });
  it('should return false when a invalid mapping items target mapping is given', () => {
    // GIVEN
    const definition = MappingSpecFactory.create();
    const mappingItem = new MappingItem({});
    definition.mappingItems = [mappingItem];

    // WHEN
    const valResult = MappingSpecValidator.validate(definition);

    // THEN
    expect(valResult.isValid).toBeFalsy();
    expect(valResult.message).toContain(
      nameof<MappingItemInterface>('targetMappings'),
    );
  });
  it('should return false when a invalid mapping items source state name is given', () => {
    // GIVEN
    const definition = MappingSpecFactory.create();
    const mappingItem = new MappingItem({ targetMappings: [] });
    definition.mappingItems = [mappingItem];

    // WHEN
    const valResult = MappingSpecValidator.validate(definition);

    // THEN
    expect(valResult.isValid).toBeFalsy();
    expect(valResult.message).toContain(
      nameof<MappingItemInterface>('sourceStateName'),
    );
  });
  it('should return false when a invalid target mapping items JSON path for value is given', () => {
    // GIVEN
    const definition = MappingSpecFactory.create();
    const targetMappingItem = new TargetMapping({});
    definition.mappingItems[0].targetMappings = [targetMappingItem];

    // WHEN
    const valResult = MappingSpecValidator.validate(definition);

    // THEN
    expect(valResult.isValid).toBeFalsy();
    expect(valResult.message).toContain(
      nameof<TargetMappingInterface>('jsonPathVal'),
    );
  });
  it('should return false when a invalid target mapping items target state name is given', () => {
    // GIVEN
    const definition = MappingSpecFactory.create();
    const targetMappingItem = new TargetMapping({ jsonPathVal: 'j2' });
    definition.mappingItems[0].targetMappings = [targetMappingItem];

    // WHEN
    const valResult = MappingSpecValidator.validate(definition);

    // THEN
    expect(valResult.isValid).toBeFalsy();
    expect(valResult.message).toContain(
      nameof<TargetMappingInterface>('targetStateName'),
    );
  });
  it('should return true when a valid definition is given', () => {
    // GIVEN
    const definition = new MappingSpec();
    definition.groupFilter = 'filter';
    definition.filterType = FilterType.Function;
    definition.mappingItems = MappingItemFactory.createMultiple(1);

    // WHEN
    const valResult = MappingSpecValidator.validate(definition);

    // THEN
    expect(valResult.isValid).toBeTruthy();
  });
});
