import * as path from "path";
import * as fs from "fs";
import * as crc32 from 'crc-32';

import { RuleBaseItem } from './ruleBaseItem';
import { MetaInfo } from '../metaInfo/metaInfo';
import { CorrelationUnitTest } from '../tests/correlationUnitTest';
import { ExtensionHelper } from '../../helpers/extensionHelper';
import { ContentTreeProvider } from '../../views/contentTree/contentTreeProvider';
import { FileSystemHelper } from '../../helpers/fileSystemHelper';
import { Configuration } from '../configuration';
import { KbHelper } from '../../helpers/kbHelper';
import { IntegrationTest } from '../tests/integrationTest';
import { ContentHelper } from '../../helpers/contentHelper';

/**
 * Обогащение
 */
export class Enrichment extends RuleBaseItem {
	
	public async save(parentFullPath?: string): Promise<void> {
		// Путь либо передан как параметр, либо он уже задан в правиле.
		let directoryFullPath = "";
		if(parentFullPath) {
			directoryFullPath = path.join(parentFullPath, this._name);
			this.setParentPath(parentFullPath);
		} else {
			directoryFullPath = this.getDirectoryPath();
		}

		if(!fs.existsSync(directoryFullPath)) {
			await fs.promises.mkdir(directoryFullPath);
		} 

		const ruleFullPath = path.join(directoryFullPath, this.getRuleFileName());
		await FileSystemHelper.writeContentFile(ruleFullPath, this._ruleCode);

		await this.getMetaInfo().save(directoryFullPath);
		await this.saveLocalizationsImpl(directoryFullPath);
		await this.saveIntegrationTest();
	}

	public async rename(newRuleName: string): Promise<void> {

		// Старые значения.
		const oldRuleName = this.getName();

		// Переименовываем директорию с правилом
		const parentDirectoryPath = this.getParentPath();

		let newRuleDirectoryPath : string;
		if(parentDirectoryPath && fs.existsSync(parentDirectoryPath)) {
			newRuleDirectoryPath = path.join(parentDirectoryPath, newRuleName);

			// Переименовываем в коде правила.
			const ruleCode = await this.getRuleCode();
			const newRuleCode = ContentHelper.replaceAllCorrelantionNameWithinCode(newRuleName, ruleCode);
			this.setRuleCode(newRuleCode);
		}

		// В метаинформации.
		const metainfo = this.getMetaInfo();
		metainfo.setName(newRuleName);

		// Замена в критериях.
		this.getMetaInfo().getEventDescriptions().forEach(ed => {
			const criteria = ed.getCriteria();
			const newCriteria = ContentHelper.replaceAllRuleNamesWithinString(oldRuleName, newRuleName, criteria);
			ed.setCriteria(newCriteria);

			const localizationId = ed.getLocalizationId();
			const newLocalizationId = ContentHelper.replaceAllRuleNamesWithinString(oldRuleName, newRuleName, localizationId);
			ed.setLocalizationId(newLocalizationId);
		});

		// Замена в тестах.
		this.getIntegrationTests().forEach( 
			it => {
				it.setRuleDirectoryPath(newRuleDirectoryPath);
				const testCode = it.getTestCode();
				const newTestCode = ContentHelper.replaceAllRuleNamesWithinString(oldRuleName, newRuleName, testCode);
				it.setTestCode(newTestCode);
			}
		);

		this.getModularTests().forEach( 
			it => {
				it.setRuleDirectoryPath(newRuleDirectoryPath);
				const testCode = it.getTestCode();
				const newTestCode = ContentHelper.replaceAllRuleNamesWithinString(oldRuleName, newRuleName, testCode);
				it.setTestCode(newTestCode);
			}
		);

		this.getLocalizations().forEach( 
			loc => {
				const localizationId = loc.getLocalizationId();
				const newLocalizationId = ContentHelper.replaceAllRuleNamesWithinString(oldRuleName, newRuleName, localizationId);
				loc.setLocalizationId(newLocalizationId);
			}
		);

		// Имя правила.
		this.setName(newRuleName);
	}

	private constructor(name: string, parentDirectoryPath? : string) {
		super(name, parentDirectoryPath);
		this.setRuleFileName("rule.en");
	}

	public static create(name: string, parentPath?: string, fileName?: string) : Enrichment {
		const rule = new Enrichment(name, parentPath);

		// Если явно указано имя файла, то сохраняем его.
		// Иначе используем заданное в конструкторе
		if (fileName){
			rule.setRuleFileName(fileName);			
		}

		const metainfo = rule.getMetaInfo();
		metainfo.setName(name);

		// Берем модуль, потому что crc32 может быть отрицательным.
		const contentPrefix = Configuration.get().getContentPrefix();
		const objectId = KbHelper.generateRuleObjectId(name, contentPrefix);
		metainfo.setObjectId(objectId);

		// Добавляем команду, которая пробрасываем параметром саму рубрику.
		rule.setCommand({ 
			command: ContentTreeProvider.onRuleClickCommand,  
			title: "Open File", 
			arguments: [rule] 
		});

		return rule;
	}

	public static async parseFromDirectory(directoryPath: string, fileName?: string) : Promise<Enrichment> {
		// Получаем имя корреляции и родительский путь.
		const name = path.basename(directoryPath);
		const parentDirectoryPath = path.dirname(directoryPath);

		const enrichment = new Enrichment(name, parentDirectoryPath);

		// Если явно указано имя файла, то сохраняем его.
		// Иначе используем заданное в конструкторе
		if (fileName){
			enrichment.setRuleFileName(fileName);			
		}

		// Парсим основные метаданные.
		const metaInfo = MetaInfo.parseFromFile(directoryPath);
		enrichment.setMetaInfo(metaInfo);

		const modularTest = CorrelationUnitTest.parseFromRuleDirectory(directoryPath, enrichment);
		enrichment.addModularTests(modularTest);

		const integrationalTests = IntegrationTest.parseFromRuleDirectory(directoryPath);
		enrichment.addIntegrationTests(integrationalTests);

		// Добавляем команду, которая пробрасываем параметром саму рубрику.
		enrichment.setCommand({ 
			command: ContentTreeProvider.onRuleClickCommand,  
			title: "Open File", 
			arguments: [enrichment] 
		});

		return enrichment;
	}

	iconPath = {
		light: path.join(ExtensionHelper.getExtentionPath(), 'resources', 'light', 'rule.svg'),
		dark: path.join(ExtensionHelper.getExtentionPath(), 'resources', 'dark', 'rule.svg')
	};

	contextValue = 'Enrichment';
}