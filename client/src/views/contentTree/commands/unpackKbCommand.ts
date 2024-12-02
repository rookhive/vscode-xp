import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';

import { DialogHelper } from '../../../helpers/dialogHelper';
import { ExecutionResult, ProcessHelper } from '../../../helpers/processHelper';
import { VsCodeApiHelper } from '../../../helpers/vsCodeApiHelper';
import { Configuration } from '../../../models/configuration';
import { ContentTreeProvider } from '../contentTreeProvider';
import { ContentTreeBaseItem } from '../../../models/content/contentTreeBaseItem';
import { ContentHelper } from '../../../helpers/contentHelper';
import { ExceptionHelper } from '../../../helpers/exceptionHelper';
import { FileSystemHelper } from '../../../helpers/fileSystemHelper';
import { YamlHelper } from '../../../helpers/yamlHelper';
import { Log } from '../../../extension';
import { ContentFolder } from '../../../models/content/contentFolder';
import { Localization } from '../../../models/content/localization';
import { ViewCommand } from '../../../models/command/command';
import { KbHelper } from '../../../helpers/kbHelper';

export class UnpackKbCommand extends ViewCommand {
  constructor(
    private config: Configuration,
    private selectedPackage: ContentTreeBaseItem
  ) {
    super();
  }

  public async execute(): Promise<void> {
    // Проверка наличия утилиты сборки kb-файлов.
    const knowledgeBasePackagerCli = this.config.getKbPackFullPath();
    if (!fs.existsSync(knowledgeBasePackagerCli)) {
      DialogHelper.showError(
        'Путь к утилите сборке kb-файла задан не верно. Измените его в настройках и повторите попытку'
      );
      await VsCodeApiHelper.openSettings(this.config.getExtensionSettingsPrefix());
      return;
    }

    if (!this.config.isKbOpened()) {
      DialogHelper.showWarning(
        this.config.getMessage('View.ObjectTree.Message.NeedToOpenKnowledgeBase')
      );
      return;
    }

    // Выбираем kb-файл.
    const kbUris = await vscode.window.showOpenDialog({
      canSelectFolders: false,
      canSelectMany: false,
      filters: { 'Knowledge base (*.kb)': ['kb'] }
    });

    if (!kbUris) {
      return;
    }

    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: true
      },
      async (progress, cancellationToken) => {
        Log.progress(progress, this.config.getMessage('View.ObjectTree.Progress.UnpackKbFile'));
        const kbFilePath = kbUris[0].fsPath;

        // Получаем путь к директории пакетов.
        const packageDirPath = this.selectedPackage.getContentRootPath(Configuration.get());
        const rootContentDirPath = path.dirname(packageDirPath);

        if (!fs.existsSync(packageDirPath)) {
          DialogHelper.showError(`Не существует такой папки для пакетов`);
          return;
        }

        // Полезно, если путь к директории временных файлов (в домашней директории) будет сокращен тильдой.
        const username = os.userInfo().username;
        Log.debug('Username:', username);

        const unpackPackagePath = this.config.getRandTmpSubDirectoryPath();
        await fs.promises.mkdir(unpackPackagePath, { recursive: true });

        const kbFileName = path.parse(kbFilePath).name;
        const outputDirPath = path.join(unpackPackagePath, kbFileName);
        Log.debug('OutputDirPath: ', outputDirPath);

        // Типовая команда выглядит так:
        // dotnet kbpack.dll unpack -s c:\tmp\pack\esc.kb -o c:\tmp\pack\unpack\doesn_t_exist_folder
        // doesn_t_exist_folder создается самим kbtools

        const params = [knowledgeBasePackagerCli, 'unpack', '-s', kbFilePath, '-o', outputDirPath];

        const cmd = 'dotnet';
        let executeResult: ExecutionResult;
        try {
          executeResult = await ProcessHelper.execute(cmd, params, {
            encoding: 'utf-8',
            outputChannel: this.config.getOutputChannel(),
            checkCommandBeforeExecution: true,
            cancellationToken: cancellationToken
          });
        } catch (error) {
          ExceptionHelper.show(
            error,
            `Ошибка выполнения команды ${cmd}. Возможно, не был установлены [.NET Runtime](https://dotnet.microsoft.com/en-us/download/dotnet/6.0) или не добавлен путь к нему в переменную PATH`
          );
          return;
        }

        if (!executeResult.output.includes(this.SUCCESS_SUBSTRING)) {
          DialogHelper.showError(
            this.config.getMessage(
              'View.ObjectTree.Message.UnpackKbFile.DefaultErrorAddingEnvelope'
            )
          );
          return;
        }

        // TODO: Убрать этот фикс, когда починят экспорт из PTKB
        ContentHelper.fixTables(outputDirPath);

        // Корректировка имени для пакетов без заданного системного имени, в таком случае оно является GUID.
        await this.correctPackageNameFromLocalizationFile(outputDirPath);

        // Меняем новые строки \n для текущей ОС
        Log.info('Converting new lines to the current OS');
        const contentFullPaths = FileSystemHelper.getRecursiveFilesSync(outputDirPath);
        for (const contentFullPath of contentFullPaths) {
          let content = await FileSystemHelper.readContentFile(contentFullPath);
          content = KbHelper.convertEOLToCurrOs(content);
          await fs.promises.writeFile(contentFullPath, content);
        }

        // Если внутри несколько пакетов.
        const packagesPackagePath = path.join(outputDirPath, ContentTreeProvider.PACKAGES_DIRNAME);
        if (fs.existsSync(packagesPackagePath)) {
          Log.info('Copying the unpacked package to the target directory');
          await fse.copy(packagesPackagePath, packageDirPath, { overwrite: true });
        }

        // Пользовательские правила и директории, которые просто лежат в корне KB.
        const objectsPackagePath = path.join(
          outputDirPath,
          ContentTreeProvider.ROOT_USERS_CONTENT_UNPACKED_DIRNAME
        );
        if (fs.existsSync(objectsPackagePath)) {
          await fse.copy(objectsPackagePath, packageDirPath, { overwrite: true });
        }

        // Обновляем макросы
        const macroPackagePath = path.join(outputDirPath, ContentTreeProvider.MACRO_DIRNAME);
        if (fs.existsSync(macroPackagePath)) {
          Log.info('Unpacking macros from a package');
          const marcoDirPath = path.join(rootContentDirPath, ContentTreeProvider.MACRO_DIRNAME);
          await fse.copy(macroPackagePath, marcoDirPath);
        }

        ContentTreeProvider.refresh();
        DialogHelper.showInfo(
          this.config.getMessage('View.ObjectTree.Message.UnpackKbFile.CompletedSuccessfully')
        );
      }
    );
  }

  private async correctPackageNameFromLocalizationFile(
    unpackPackageDirPath: string
  ): Promise<void> {
    const packagesPath = path.join(unpackPackageDirPath, ContentTreeProvider.PACKAGES_DIRNAME);
    if (!fs.existsSync(packagesPath)) {
      return;
    }

    const packageNames = FileSystemHelper.readSubDirectoryNames(packagesPath);

    // Выбираем пакеты, именованные как идентификаторы
    for (const packageName of packageNames) {
      const regExp = /[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}/g;
      if (regExp.test(packageName)) {
        const metaDirPath = path.join(
          packagesPath,
          packageName,
          ContentFolder.PACKAGE_METAINFO_DIRNAME
        );
        if (!fs.existsSync(metaDirPath)) {
          continue;
        }

        const packageLocalizationPath = path.join(
          metaDirPath,
          Localization.LOCALIZATIONS_DIRNAME,
          Localization.EN_LOCALIZATION_FILENAME
        );
        if (!fs.existsSync(packageLocalizationPath)) {
          continue;
        }

        const localizationString = await FileSystemHelper.readContentFile(packageLocalizationPath);
        const localizationObject = YamlHelper.parse(localizationString);
        if (!localizationObject.Name) {
          continue;
        }

        // Убираем пробелы на всякий случай
        let packageLocalizationName = localizationObject.Name;
        packageLocalizationName = packageLocalizationName.replace(/[ ]+/gm);

        const existPackagePath = path.join(packagesPath, packageName);
        const correctedPackagePath = path.join(packagesPath, packageLocalizationName);

        await fse.move(existPackagePath, correctedPackagePath, { overwrite: true });
      }
    }
  }

  private readonly SUCCESS_SUBSTRING = 'Knowledge base unpacking completed successfully';
}
