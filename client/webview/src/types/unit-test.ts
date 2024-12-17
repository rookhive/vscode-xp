import { Language, RuleType } from './common';

export type UnitTestDto = {
  ruleType: RuleType;
  inputEvents: { data: string; language?: Language };
  expectation: { data: string; language?: Language };
};
