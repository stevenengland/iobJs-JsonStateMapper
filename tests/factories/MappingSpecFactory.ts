import { faker } from '@faker-js/faker';
import {
  FilterType,
  MappingItem,
  MappingSpec,
} from '../../src/JsonStateMapper';
import { MappingItemFactory } from './MappingItemFactory';

interface Builder {
  withGroupFilter(groupFilter: string): this;
  withFilterType(filterType: FilterType): this;
  withMappingItems(mappingItems: MappingItem[]): this;
  build(): MappingSpec;
}

export class MappingSpecBuilder implements Builder {
  private mappingSpec: MappingSpec;

  constructor() {
    this.mappingSpec = new MappingSpec();
  }

  public withGroupFilter(groupFilter?: string): this {
    this.mappingSpec.groupFilter =
      typeof groupFilter !== 'undefined'
        ? groupFilter
        : faker.helpers.fromRegExp(/[a-z]{5}_filter/);
    return this;
  }
  public withFilterType(filterType?: FilterType): this {
    this.mappingSpec.filterType =
      typeof filterType !== 'undefined'
        ? filterType
        : faker.helpers.enumValue(FilterType);
    return this;
  }
  public withMappingItems(mappingItems?: MappingItem[]): this {
    this.mappingSpec.mappingItems =
      typeof mappingItems !== 'undefined'
        ? mappingItems
        : MappingItemFactory.createMultiple(3);
    return this;
  }
  public build(): MappingSpec {
    return this.mappingSpec;
  }
}

export class MappingSpecFactory {
  public static create(): MappingSpec {
    const builder = new MappingSpecBuilder();
    return builder
      .withGroupFilter()
      .withFilterType()
      .withMappingItems()
      .build();
  }
  public static createWithFiltertype(filterType: FilterType): MappingSpec {
    const builder = new MappingSpecBuilder();
    return builder
      .withGroupFilter()
      .withFilterType(filterType)
      .withMappingItems()
      .build();
  }
}
