import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import { DialogHelper } from '../../helpers/dialogHelper';
import { RuleBaseItem } from '../../models/content/ruleBaseItem';
import { MustacheFormatter } from '../mustacheFormatter';
import { MetaInfoUpdater } from './metaInfoUpdater';
import { Configuration } from '../../models/configuration';
import { ExceptionHelper } from '../../helpers/exceptionHelper';
import { BaseWebViewController } from '../baseWebViewController';
import { FileSystemHelper } from '../../helpers/fileSystemHelper';

interface AssociativeArray {
  [key: string]: MetainfoViewProvider;
}

export class MetainfoViewProvider extends BaseWebViewController {
  protected onDispose(e: void): void {
    const ruleName = this.rule.getName();
    delete MetainfoViewProvider.Providers[ruleName];
  }

  protected getTitle(): string {
    return this.config.getMessage('View.Metainfo', this.rule.getName());
  }

  protected async receiveMessageFromWebView(message: any): Promise<void> {
    switch (message.command) {
      case 'saveMetaInfo': {
        try {
          // Обновление метаданных.
          const newMetaInfoPlain = message.metainfo;
          const metaInfo = this.rule.getMetaInfo();
          this.metaInfoUpdater.update(metaInfo, newMetaInfoPlain);

          // Сохранением и перечитываем из файла.
          const corrFullPath = this.rule.getDirectoryPath();
          await metaInfo.save(corrFullPath);
        } catch (error) {
          return ExceptionHelper.show(
            error,
            this.config.getMessage('View.Metainfo.Message.DefaultErrorMetaInfoSave')
          );
        }

        DialogHelper.showInfo(this.config.getMessage('View.Metainfo.Message.MetadataIsSaved'));
      }
    }
  }

  protected renderHtml(): string {
    // Данные в таком виде проще шаблонизировать.
    const metaInfo = this.rule.getMetaInfo().toObject();

    const webviewUri = FileSystemHelper.getUri(
      this.webView.webview,
      this.config.getExtensionUri(),
      ['client', 'out', 'ui.js']
    );
    const extensionBaseUri = FileSystemHelper.getUri(
      this.webView.webview,
      this.config.getExtensionUri()
    );
    const metainfoHtml = this.formatter.format({
      ...metaInfo,
      ExtensionBaseUri: extensionBaseUri,
      WebviewUri: webviewUri,

      // Локализация
      Localization: {
        Save: this.config.getMessage('Save'),
        KnowledgeHolders: this.config.getMessage('View.Metainfo.KnowledgeHolders'),
        Created: this.config.getMessage('View.Metainfo.Created'),
        Updated: this.config.getMessage('View.Metainfo.Updated'),
        Id: this.config.getMessage('View.Metainfo.Id'),
        Usecases: this.config.getMessage('View.Metainfo.Usecases'),
        Falsepositives: this.config.getMessage('View.Metainfo.Falsepositives'),
        Improvements: this.config.getMessage('View.Metainfo.Improvements'),
        References: this.config.getMessage('View.Metainfo.References'),
        DataSources: this.config.getMessage('View.Metainfo.DataSources'),
        MITRE: this.config.getMessage('View.Metainfo.MITRE')
      }
    });

    return metainfoHtml;
  }

  protected preRender(): Promise<boolean> {
    return Promise.resolve(true);
  }

  public static readonly viewId = 'MetaInfoView';
  public static showMetaInfoEditorCommand = 'MetaInfoView.showMetaInfoEditor';

  constructor(
    private readonly rule: RuleBaseItem,
    private readonly config: Configuration,
    private readonly formatter: MustacheFormatter
  ) {
    super({
      config: config,
      viewId: MetainfoViewProvider.viewId,
      webViewOptions: {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    });
  }

  public static async init(config: Configuration): Promise<void> {
    const metaInfoTemplateFilePath = path.join(
      config.getExtensionPath(),
      'client',
      'templates',
      'MetaInfo.html'
    );
    const metainfoTemplateContent =
      await FileSystemHelper.readContentFile(metaInfoTemplateFilePath);

    config.getContext().subscriptions.push(
      vscode.commands.registerCommand(
        MetainfoViewProvider.showMetaInfoEditorCommand,
        async (rule: RuleBaseItem) => {
          const ruleName = rule.getName();
          if (MetainfoViewProvider.Providers[ruleName]) {
            MetainfoViewProvider.Providers[ruleName].reveal();
            return;
          }

          const provider = new MetainfoViewProvider(
            rule,
            config,
            new MustacheFormatter(metainfoTemplateContent)
          );
          MetainfoViewProvider.Providers[ruleName] = provider;

          provider.show();
        }
      )
    );
  }

  private metaInfoUpdater = new MetaInfoUpdater();

  public static Providers: AssociativeArray[] = [];
}
