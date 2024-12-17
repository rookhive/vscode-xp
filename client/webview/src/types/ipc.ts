// Types for communication between extension and webviews

import { MetaInfoDto, TableListDto, UnitTestDto } from '.';

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
  | { command: 'TableListEditor.saveTableList'; payload: TableListDto }

  // Meta Info Editor
  | { command: 'MetaInfoEditor.saveMetaInfo'; payload: MetaInfoDto }
  | { command: 'MetaInfoEditor.openFileByObjectId'; payload: { objectId: string } };

/**
 * Messages the extension sends to the webview pages
 */
export type ResponseMessage =
  // Any message
  | ({ command: '*' } & Record<string, unknown>)

  // Unit Test Editor
  | { command: 'UnitTestEditor.setState'; payload: UnitTestDto }
  | { command: 'UnitTestEditor.updateExpectation'; expectation: string }
  | { command: 'UnitTestEditor.updateInputData'; inputData: string }
  | { command: 'UnitTestEditor.updateActualData'; actualData: string }

  // Table List Editor
  | { command: 'TableListEditor.setState'; payload: TableListDto }
  | { command: 'TableListEditor.saveTableList' }

  // Meta Info Editor
  | { command: 'MetaInfoEditor.setState'; payload: { metaInfo: MetaInfoDto; author: string } };
