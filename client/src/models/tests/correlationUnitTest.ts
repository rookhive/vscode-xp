import * as path from 'path';
import * as fs from 'fs';

import { UnitTestContentEditorViewProvider } from '../../views/unitTestEditor/unitTestEditorViewProvider';
import { BaseUnitTest } from './baseUnitTest';
import { FileSystemHelper } from '../../helpers/fileSystemHelper';
import { RuleBaseItem } from '../content/ruleBaseItem';
import { Correlation } from '../content/correlation';
import { XpException } from '../xpException';
import { Enrichment } from '../content/enrichment';
import { TestHelper } from '../../helpers/testHelper';
import { StringHelper } from '../../helpers/stringHelper';

export class CorrelationUnitTest extends BaseUnitTest {
  public getDefaultExpectation(): string {
    return `# Тут будет твой тест. В секции expect укажи сколько и каких корреляционных событий ты ожидаешь\nexpect 1 {"correlation_name":"${this._rule.getName()}"}\n`;
  }

  public getDefaultInputData(): string {
    return `# Здесь укажи какие нормализованные события (одно или несколько) ты подаешь на вход правилу корреляции.\n# События отделяются друг от друга символом новой строки. Каждое их них должно быть записано в строку.\n`;
  }

  public static containsInputData(fileContent: string): boolean {
    const inputData = /(?:^\{.*?\}$)/gms.exec(fileContent);
    if (!inputData || inputData.length === 0) {
      return false;
    }
    return true;
  }

  public static containsExpectation(fileContent: string): boolean {
    const expectation = /(?:^expect\s+(?:\d+|not)\s+\{.*?\}$)/gms.exec(fileContent);
    if (!expectation || expectation.length === 0) {
      return false;
    }
    return true;
  }

  public static fixStrings(rulePart: string): string {
    let data = rulePart.replace(/\r/gms, '');
    data = data.replace(/^\s*\n/gms, '');
    data = data.replace(/#(\S)/gms, '# $1');
    return data.trim();
  }

  public static readFromFile(filePath: string, rule: RuleBaseItem): CorrelationUnitTest {
    if (!fs.existsSync(filePath)) {
      throw new XpException(`Невозможно создать тест. Файла ${filePath} нет на диске`);
    }
    const testFileContent = FileSystemHelper.readContentFileSync(filePath);
    const unitTest = rule.createNewUnitTest();

    const inputDataStrings: string[] = [];

    const table_list_default = /(?:^#.*$|\r?\n)*^table_list\s+default$/m.exec(testFileContent);
    if (table_list_default && table_list_default.length === 1) {
      inputDataStrings.push(table_list_default[0].trim());
    }

    const table_list = /(?:^#.*$|\r?\n)*^table_list\s+\{.*?\}$/m.exec(testFileContent);
    if (table_list && table_list.length === 1) {
      inputDataStrings.push(table_list[0].trim());
    }

    let m: RegExpExecArray;
    const event_pattern = /(?:^#.*?$|\s)*(?:^\{.*?\}$)/gm;
    while ((m = event_pattern.exec(testFileContent))) {
      inputDataStrings.push(m[0].trim());
    }

    const inputDataResultString = inputDataStrings.join(BaseUnitTest.UNIT_TEST_NEWLINE_SYMBOL);
    unitTest.setTestInputData(inputDataResultString);

    // expected block
    let expectationData = testFileContent;
    for (const ids of inputDataStrings) {
      expectationData = StringHelper.safeReplace(expectationData, ids, '');
    }

    expectationData = expectationData.trim();
    unitTest.setTestExpectation(expectationData);

    unitTest.command = {
      command: UnitTestContentEditorViewProvider.onTestSelectionChangeCommand,
      title: 'ModularTestContentEditorViewProvider.onTestSelectionChangeCommand',
      arguments: [unitTest]
    };

    return unitTest;
  }

  public static parseFromRuleDirectory(rule: Correlation | Enrichment): CorrelationUnitTest[] {
    const ruleDirectoryFullPath = rule.getDirectoryPath();
    const testsFullPath = path.join(ruleDirectoryFullPath, RuleBaseItem.TESTS_DIRNAME);
    if (!fs.existsSync(testsFullPath)) {
      return [];
    }

    try {
      const tests = fs
        .readdirSync(testsFullPath)
        .map((f) => path.join(testsFullPath, f))
        .filter((f) => f.endsWith('.sc'))
        .filter((f) => fs.existsSync(f))
        .map((f, _) => {
          return CorrelationUnitTest.readFromFile(f, rule);
        })
        .filter((t): t is CorrelationUnitTest => !!t)
        // Сортируем тесты, ибо в противном случае сначала будет 1, потом 10 и т.д.
        .sort((a, b) => a.getNumber() - b.getNumber());

      return tests;
    } catch (error) {
      throw new XpException('Error parsing unit tests rules', error);
    }
  }

  public static create(rule: RuleBaseItem): CorrelationUnitTest {
    const baseDirFullPath = rule.getDirectoryPath();
    let testsFullPath: string;
    if (baseDirFullPath) {
      testsFullPath = path.join(baseDirFullPath, RuleBaseItem.TESTS_DIRNAME);
    }

    for (let testNumber = 1; testNumber < CorrelationUnitTest.MAX_TEST_INDEX; testNumber++) {
      // Если задан путь к правилу
      if (testsFullPath) {
        const testFullPath = path.join(testsFullPath, `test_${testNumber}.sc`);
        if (fs.existsSync(testFullPath)) continue;
      }

      const test = new CorrelationUnitTest(testNumber);
      test.setRule(rule);
      test.setTestExpectation(test.getDefaultExpectation());
      test.setTestInputData(test.getDefaultInputData());
      test.command = {
        command: UnitTestContentEditorViewProvider.onTestSelectionChangeCommand,
        title: 'Open File',
        arguments: [test]
      };
      return test;
    }
  }

  public async save(): Promise<void> {
    if (!this.getTestsDirPath()) {
      throw new XpException('Не задан путь для сохранения');
    }

    if (!this.getNumber()) {
      throw new XpException('Для модульного теста не задан порядковый номер');
    }

    // Модульные тесты корреляций содержат условия и начальные данные в одном файле
    const minifiedTestInput = this.getTestInputData();
    this.setTestInputData(minifiedTestInput);

    const minifiedTestExpectation = TestHelper.compressTestCode(this.getTestExpectation());
    this.setTestExpectation(minifiedTestExpectation);

    const fileContent =
      minifiedTestInput +
      BaseUnitTest.UNIT_TEST_NEWLINE_SYMBOL +
      BaseUnitTest.UNIT_TEST_NEWLINE_SYMBOL +
      minifiedTestExpectation;
    const filePath = this.getTestExpectationPath();

    return fs.writeFileSync(filePath, fileContent, FileSystemHelper._fileEncoding);
  }

  constructor(testNumber: number) {
    super(testNumber);
  }

  public getTestExpectationPath(): string {
    return path.join(this.getTestsDirPath(), `test_${this.getNumber()}.sc`);
  }

  public getTestInputDataPath(): string {
    return '';
  }

  private static MAX_TEST_INDEX = 255;
}
