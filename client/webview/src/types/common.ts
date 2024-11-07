// Common types used in various editors

export type PageName =
  | 'meta-info-editor'
  | 'unit-test-editor'
  | 'table-list-editor'
  | 'create-rule-editor'
  | 'localization-editor'
  | 'full-graph-run-editor'
  | 'integration-test-editor';

export type Language = 'json' | 'json-lines' | 'xp-test-code';

export type Translations = Record<string, string>;

export type RuleType = 'correlation' | 'normalization';
