import * as fs from 'fs';
import * as vscode from 'vscode';

import { Configuration } from '../../models/configuration';
import { BaseUnitTest } from '../../models/tests/baseUnitTest';
import { TestHelper } from '../../helpers/testHelper';
import { DialogHelper } from '../../helpers/dialogHelper';
import { ExceptionHelper } from '../../helpers/exceptionHelper';
import { UnitTestsListViewProvider } from './unitTestsListViewProvider';
import { XpException } from '../../models/xpException';
import { RegExpHelper } from '../../helpers/regExpHelper';
import { Correlation } from '../../models/content/correlation';
import { Normalization } from '../../models/content/normalization';
import { WebViewProviderBase } from '../tableListsEditor/webViewProviderBase';
import webviewHtmlProvider from '../webviewHtmlProvider';

export class UnitTestContentEditorViewProvider extends WebViewProviderBase {
  public static readonly viewId = 'ModularTestContentEditorView';

  public static readonly showEditorCommand = 'ModularTestContentEditorView.showEditor';
  public static readonly onTestSelectionChangeCommand =
    'ModularTestContentEditorView.onTestSelectionChange';

  private test: BaseUnitTest;

  public constructor(private readonly _config: Configuration) {
    super();
  }

  public static init(config: Configuration): void {
    const context = config.getContext();

    const provider = new UnitTestContentEditorViewProvider(config);

    // Открытие кода теста по нажатию на его номер.
    context.subscriptions.push(
      vscode.commands.registerCommand(
        UnitTestContentEditorViewProvider.showEditorCommand,
        async (test: BaseUnitTest) => {
          const testPath = test.getTestExpectationPath();
          if (!fs.existsSync(testPath)) {
            vscode.window.showWarningMessage(`Не удалось открыть тест: '${testPath}'`);
            return;
          }
          // test.show();
          provider.showEditor(test);
        }
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        UnitTestContentEditorViewProvider.onTestSelectionChangeCommand,
        async (test: BaseUnitTest) => {
          // Открываем код теста.
          vscode.commands.executeCommand(UnitTestContentEditorViewProvider.showEditorCommand, test);
        }
      )
    );
  }

  public async showEditor(unitTest: BaseUnitTest): Promise<void> {
    if (this.getView()) {
      this.test = null;
      this.getView().dispose();
    }

    if (!(unitTest instanceof BaseUnitTest)) {
      return;
    }

    this.test = unitTest;
    const rule = this.test.getRule();

    // Создать и показать панель.
    const viewTitle = `Тест №${this.test.getNumber()} правила '${rule.getName()}'`;
    const panel = vscode.window.createWebviewPanel(
      UnitTestContentEditorViewProvider.viewId,
      viewTitle,
      vscode.ViewColumn.One,
      {
        retainContextWhenHidden: true,
        enableFindWidget: true
      }
    );

    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._config.getExtensionUri(), 'client/webview/out/assets'),
        vscode.Uri.joinPath(this._config.getExtensionUri(), 'client/webview/node_modules')
      ]
    };

    panel.webview.onDidReceiveMessage(this.receiveMessageFromWebView, this);

    this.setView(panel);

    await this.updateView();
  }

  private async updateView(): Promise<void> {
    try {
      vscode.commands.executeCommand(UnitTestsListViewProvider.refreshCommand);

      const getTranslation: (s: string) => string = this._config.getMessage.bind(this._config);

      const translations = {
        EditorTitle: getTranslation('View.UnitTests.EditorTitle'),
        Save: getTranslation('Save'),
        Run: getTranslation('View.UnitTests.Run'),
        WordWrap: getTranslation('View.UnitTests.WordWrap'),
        ActualResult: getTranslation('View.UnitTests.ActualResult'),
        ConditionForPassingTheTest: getTranslation('View.UnitTests.ConditionForPassingTheTest'),
        CorrelationRawEvents: getTranslation('View.UnitTests.CorrelationRawEvents'),
        NormalizationRawEvents: getTranslation('View.UnitTests.NormalizationRawEvents'),
        ReplaceExpectedEventWithActual: getTranslation(
          'View.UnitTests.ReplaceExpectedEventWithActual'
        )
      };

      const webviewRootUri = this.getView()
        .webview.asWebviewUri(this._config.getExtensionUri())
        .toString();

      const htmlContent = await webviewHtmlProvider.getWebviewHtml(
        'unit-test-editor',
        webviewRootUri,
        translations
      );

      this.setHtmlContent(htmlContent);
    } catch (error) {
      DialogHelper.showError('Не удалось открыть модульный тест', error);
    }
  }

  private async receiveMessageFromWebView(message: any) {
    switch (message.command) {
      case 'documentIsReady': {
        return this.documentIsReadyHandler();
      }
      case 'UnitTestEditor.saveTest': {
        await this.saveTest(message);
        await this.updateInputDataInView(this.test.getTestInputData());

        const expectationData = TestHelper.formatTestCodeAndEvents(this.test.getTestExpectation());
        await this.updateExpectationInView(expectationData);

        return;
      }

      case 'UnitTestEditor.runTest': {
        await this.runUnitTestHandler(message);
        return;
      }

      case 'UnitTestEditor.updateExpectation': {
        await this.updateExpectationHandler();
        return;
      }

      default: {
        DialogHelper.showError('The transmitted command is not supported');
      }
    }
  }

  private async updateExpectationHandler(): Promise<void> {
    const actualEvent = this.test.getActualData();
    if (!actualEvent) {
      DialogHelper.showWarning(
        'Фактическое событие не получено. Запустите тест для получения фактического события, после чего можно заменить ожидаемое событие фактическим'
      );
      return;
    }

    const rule = this.test.getRule();
    let testResult: string;

    // В модульных тестах корреляций есть expect и возможны комментарии, поэтому надо заменить события, сохранив остальное.
    if (rule instanceof Correlation) {
      const newTestCode = `expect 1 ${actualEvent}`;
      const currentTestCode = this.test.getTestExpectation();
      testResult = currentTestCode.replace(
        RegExpHelper.getExpectSectionRegExp(),
        // Фикс того, что из newTestCode пропадают доллары
        // https://stackoverflow.com/questions/9423722/string-replace-weird-behavior-when-using-dollar-sign-as-replacement
        function () {
          return newTestCode;
        }
      );
    }

    // Для нормализации просто сохраняем фактическое событие без дополнительных преобразований.
    if (rule instanceof Normalization) {
      testResult = actualEvent;
    }

    // Обновляем ожидаемое событие на диске и во вьюшке.
    this.test.setTestExpectation(testResult);
    await this.test.save();

    this.updateExpectationInView(testResult);
    // TODO: translate
    DialogHelper.showInfo('Ожидаемое событие обновлено. Запустите еще раз тест, он должен пройти');
  }

  private async documentIsReadyHandler(): Promise<boolean> {
    const inputEvents = this.test.getTestInputData();

    const expectationData = TestHelper.formatTestCodeAndEvents(this.test.getTestExpectation());

    let inputType = undefined;
    let expectationLanguage = undefined;
    const rule = this.test.getRule();
    // Для корреляций на вход всегда json (нормализованное событие)
    // Код теста это xp-test-code (json, expect, default и т.д.)
    if (rule instanceof Correlation) {
      inputType = 'json';
      expectationLanguage = 'xp-test-code';
    }

    // TODO: Для законченной нормализации в теории можно распарсить код правила и понять какой тип данных в raw_N.txt
    // Ожидаемое событие всегда json
    if (rule instanceof Normalization) {
      const ruleCode = await rule.getRuleCode();
      if (ruleCode.match(/^JSON\s*=\s*/)) {
        inputType = 'json';
      }

      expectationLanguage = 'json';
    }

    // Контракт на команду к FE
    // {
    // command = 'setIUnitTestEditorViewContent',
    // inputEvents : {language: json, data: string},
    // expectation: {language: json|xp-test-code, data: string},
    // }
    await this.postMessage({
      command: 'UnitTestEditor.setState',
      payload: {
        ruleType: rule instanceof Correlation ? 'correlation' : 'normalization',
        inputEvents: { language: inputType, data: inputEvents },
        expectation: { language: expectationLanguage, data: expectationData }
      }
    });

    // Если в тесте сохранены фактические данные, например, после запуска тестов по списку.
    const actualData = this.test.getActualData();
    if (actualData) {
      return this.updateActualDataInView(actualData);
    }
  }

  private async saveTest(message: any) {
    try {
      const inputData = message?.inputData;
      if (!inputData) {
        throw new XpException(
          `Не задано сырое событие для теста №${this.test.getNumber()}. Добавьте его и повторите`
        );
      }
      this.test.setTestInputData(inputData);

      const expectation = message?.expectation;
      if (!expectation) {
        throw new XpException(
          `Не задано ожидаемое нормализованное событие для теста №${this.test.getNumber()}. Добавьте его и повторите`
        );
      }

      this.test.setTestExpectation(expectation);
      await this.test.save();

      DialogHelper.showInfo('Тест успешно сохранен');
    } catch (error) {
      ExceptionHelper.show(
        error,
        `Не удалось сохранить модульный тест №${
          this.test.label
        } правила ${this.test.getRule().getName()}`
      );
    }
  }

  private async runUnitTestHandler(message: any) {
    if (!message?.inputData) {
      DialogHelper.showError('Не заданы входные данные теста. Задайте их и повторите');
      return;
    }

    if (!message?.expectation) {
      DialogHelper.showError(
        'Не задано условие проверки теста или ожидаемое событие. Задайте его и повторите'
      );
      return;
    }

    // Обновляем тест и сохраняем
    const expectation = message.expectation;
    this.test.setTestExpectation(expectation);

    const inputData = message?.inputData;
    this.test.setTestInputData(inputData);
    await this.test.save();

    const rule = this.test.getRule();
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: false
      },
      async (progress) => {
        try {
          progress.report({
            message: `Выполнение теста №${this.test.getNumber()}`
          });
          const runner = rule.getUnitTestRunner();
          this.test = await runner.run(this.test);

          const actualData = this.test.getActualData();
          this.updateActualDataInView(actualData);
        } catch (error) {
          const outputData = this.test.getOutput();
          this.updateActualDataInView(outputData);
          ExceptionHelper.show(error, 'Неожиданная ошибка выполнения модульного теста');
        } finally {
          vscode.commands.executeCommand(UnitTestsListViewProvider.refreshCommand);
        }
      }
    );
  }

  private async updateExpectationInView(expectation: string): Promise<boolean> {
    return this.postMessage({
      command: 'UnitTestEditor.updateExpectation',
      expectation: expectation
    });
  }

  private async updateInputDataInView(inputData: string): Promise<boolean> {
    return this.postMessage({
      command: 'UnitTestEditor.updateInputData',
      inputData: inputData
    });
  }

  private async updateActualDataInView(actualData: string): Promise<boolean> {
    return this.postMessage({
      command: 'UnitTestEditor.updateActualData',
      actualData: actualData
    });
  }
}
