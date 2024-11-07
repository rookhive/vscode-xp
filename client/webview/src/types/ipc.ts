// Types for communication between extension and webviews

import { Language, RuleType, TableListDto } from '.';

/**
 * Messages webview pages send to the extension
 */
export type RequestMessage =
  // Shared commands between all pages
  | { command: 'documentIsReady' }

  // Unit Test Editor
  | { command: 'UnitTestEditor.updateExpectation'; expectation: string }
  | { command: 'UnitTestEditor.saveTest'; expectation: string; inputData: string }
  | { command: 'UnitTestEditor.runTest'; expectation: string; inputData: string }

  // Table List Editor
  | { command: 'TableListEditor.saveTableList'; payload: TableListDto };

/**
 * Messages the extension sends to the webview pages
 */
export type ResponseMessage =
  // Any message
  | ({ command: '*' } & Record<string, unknown>)

  // Unit Test Editor
  | {
      command: 'UnitTestEditor.setState';
      payload: {
        ruleType: RuleType;
        inputEvents: { data: string; language?: Language };
        expectation: { data: string; language?: Language };
      };
    }
  | { command: 'UnitTestEditor.updateExpectation'; expectation: string }
  | { command: 'UnitTestEditor.updateInputData'; inputData: string }
  | { command: 'UnitTestEditor.updateActualData'; actualData: string }

  // Table List Editor
  | { command: 'TableListEditor.setState'; payload: TableListDto }
  | { command: 'TableListEditor.saveTableList' };
