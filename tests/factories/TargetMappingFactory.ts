import { faker } from '@faker-js/faker';
import {
  TargetMapping,
  TargetMappingInterface,
} from '../../src/JsonStateMapper';

interface Builder {
  withTargetStateName(): this;
  withJsonPathVal(): this;
  withJsonPathTs(): this;
  build(): TargetMapping;
}

export class TargetMappingBuilder implements Builder {
  private targetMapping: TargetMapping;

  constructor() {
    this.targetMapping = new TargetMapping({});
  }
  public withTargetStateName(): this {
    this.targetMapping.targetStateName = faker.string.alpha(10);
    return this;
  }
  public withJsonPathVal(): this {
    this.targetMapping.jsonPathVal = faker.string.alpha(10);
    return this;
  }
  public withJsonPathTs(): this {
    this.targetMapping.jsonPathTimestamp = faker.string.alpha(10);
    return this;
  }
  public build() {
    return this.targetMapping;
  }
}

export class TargetMappingFactory {
  public static create(withTimestamp: boolean = true): TargetMappingInterface {
    const builder = new TargetMappingBuilder();
    builder.withTargetStateName().withJsonPathVal();
    if (withTimestamp) {
      builder.withJsonPathTs();
    }
    return builder.build();
  }

  public static createMultiple(count: number): TargetMappingInterface[] {
    const results = new Array<TargetMappingInterface>();
    for (let i = 0; i < count; i++) {
      results.push(this.create());
    }
    return results;
  }
}
