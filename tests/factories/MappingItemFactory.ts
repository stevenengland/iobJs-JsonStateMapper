import { faker } from '@faker-js/faker';
import { MappingItem, TargetMapping } from '../../src/JsonStateMapper';
import { TargetMappingFactory } from './TargetMappingFactory';

interface Builder {
  withSourceStateName(sourceStateName: string): this;
  withTargetMappings(targetMappings: TargetMapping[]): this;
  build(): MappingItem;
}

export class MappingItemBuilder implements Builder {
  private mappingItem: MappingItem;

  constructor() {
    this.mappingItem = new MappingItem({});
  }

  public withSourceStateName(sourceStateName?: string): this {
    this.mappingItem.sourceStateName =
      typeof sourceStateName !== 'undefined'
        ? sourceStateName
        : faker.helpers.fromRegExp(/statename_[a-z]{5}/);
    return this;
  }
  public withTargetMappings(targetMappings?: TargetMapping[]): this {
    this.mappingItem.targetMappings =
      typeof targetMappings !== 'undefined'
        ? targetMappings
        : TargetMappingFactory.createMultiple(3);
    return this;
  }
  public build(): MappingItem {
    return this.mappingItem;
  }
}

export class MappingItemFactory {
  public static create(): MappingItem {
    const builder = new MappingItemBuilder();
    return builder.withSourceStateName().withTargetMappings().build();
  }

  public static createMultiple(count: number): MappingItem[] {
    const result = new Array<MappingItem>();
    for (let i = 0; i < count; i++) {
      result.push(this.create());
    }
    return result;
  }

  public static createWithPrefixedSourceStateName(
    count: number,
    prefix: string = '',
  ): MappingItem[] {
    const result = new Array<MappingItem>();
    for (let i = 0; i < count; i++) {
      const mappingItem = this.create();
      mappingItem.sourceStateName = prefix + i;
      result.push(mappingItem);
    }
    return result;
  }
}
