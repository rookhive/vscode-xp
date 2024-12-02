import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import { Command, IntegrationTestParams } from '../../../models/command/command';
import { DialogHelper } from '../../../helpers/dialogHelper';
import { FileSystemHelper } from '../../../helpers/fileSystemHelper';
import { TestHelper } from '../../../helpers/testHelper';
import { XpException } from '../../../models/xpException';
import { Log } from '../../../extension';
import { FileSystemException } from '../../../models/fileSystemException';
import { VsCodeApiHelper } from '../../../helpers/vsCodeApiHelper';

export class ShowActualEventCommand extends Command {
  constructor(private params: IntegrationTestParams) {
    super();
  }

  public async execute(): Promise<boolean> {
    const ruleName = this.params.rule.getName();
    Log.info(`Запрошено фактического события ${ruleName} теста №${this.params.testNumber}`);

    // Получаем ожидаемое событие.
    const tests = this.params.rule.getIntegrationTests();
    if (tests.length < this.params.testNumber) {
      // TODO: внутренняя ошибка
      DialogHelper.showError(
        `Запрашиваемый интеграционный тест №${this.params.testNumber} правила ${ruleName} не найден`
      );
      return;
    }

    if (!fs.existsSync(this.params.tmpDirPath)) {
      DialogHelper.showError(
        this.params.config.getMessage('View.IntegrationTests.Message.NoTestResultFound')
      );
      return;
    }

    // Получаем фактическое событие.
    const actualEventsFilePath = TestHelper.getEnrichedCorrEventFilePath(
      this.params.tmpDirPath,
      ruleName,
      this.params.testNumber
    );
    if (!actualEventsFilePath) {
      throw new XpException(
        `Результаты интеграционного теста №${this.params.testNumber} правила ${ruleName} не найдены`
      );
    }

    if (!fs.existsSync(actualEventsFilePath)) {
      throw new FileSystemException(
        `Файл результатов тестов ${actualEventsFilePath} не найден`,
        actualEventsFilePath
      );
    }

    // Событие может прилетать не одно
    const actualEventsString = await FileSystemHelper.readContentFile(actualEventsFilePath);
    if (!actualEventsString) {
      throw new XpException(
        `Фактическое событий интеграционного теста №${this.params.testNumber} правила ${ruleName} пусто`
      );
    }

    // Очищаем события от технических полей и форматируем для вывода.
    const actualEvents = actualEventsString.split(os.EOL).filter((l) => l);
    const actualFilteredEvents = TestHelper.cleanJsonlEventFromTechnicalFields(actualEvents).join(
      os.EOL
    );
    const formattedActualEvent = TestHelper.formatTestCodeAndEvents(actualFilteredEvents);

    // Записываем очищенное фактическое значение файл для последующего сравнения
    const actualEventTestFilePath = path.join(
      this.params.tmpDirPath,
      `actualEvents${this.params.testNumber}.json`
    );
    await FileSystemHelper.writeContentFile(actualEventTestFilePath, formattedActualEvent);

    Log.info(`Фактическое событие сохранено в файле по пути ${actualEventTestFilePath}`);

    VsCodeApiHelper.open(vscode.Uri.file(actualEventTestFilePath));
    return true;
  }
}
