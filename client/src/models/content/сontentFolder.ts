import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { FileSystemHelper } from '../../helpers/fileSystemHelper';
import { ExtensionHelper } from '../../helpers/extensionHelper';
import { RuleBaseItem } from './ruleBaseItem';

export enum ContentFolderType {
	ContentRoot = 1,
	PackageFolder, 		// Директория пакета
	CorrelationsFolder, 	// Директория, с базовой директорией correlation_rules
	EnrichmentsFolder, 		// Директория, с базовой директорией enrichment_rules
	AggregationsFolder, 	// Директория, с базовой директорией aggregation_rules
	NormalizationsFolder, 	// Директория, с базовой директорией normalization_formulas
	TabularListsFolder,		// Директория, с базовой директорией tabular_lists
	AnotherFolder,
}

export class ContentFolder extends RuleBaseItem {

	public async rename(newName: string): Promise<void> {
		throw new Error('Method not implemented.');
	}

	public getRuleFileName(): string {
		throw new Error('Method not implemented.');
	}

	public getRuleFilePath(): string {
		return this.getDirectoryPath();
	}

	public getDirectoryPath() : string {
		if(!this.getParentPath()) {
			throw new Error(`Не задан путь к директории правила '${this.getName()}'.`);
		}

		return path.join(this.getParentPath(), this.getName());
	}

	public async save(fullPath?: string): Promise<void> {
		throw new Error('Method not implemented.');
	}

	constructor(directoryName: string, type: ContentFolderType, hasNestedElements: boolean) {
		
		super(directoryName);

		if(type == ContentFolderType.PackageFolder || type == ContentFolderType.ContentRoot) {
			this.iconPath = {
				light: path.join(ExtensionHelper.getExtentionPath(), 'resources', 'light', 'package.svg'),
				dark: path.join(ExtensionHelper.getExtentionPath(), 'resources', 'dark', 'package.svg')
			};
		} else {
			this.iconPath = {
				light: path.join(ExtensionHelper.getExtentionPath(), 'resources', 'light', 'folder.svg'),
				dark: path.join(ExtensionHelper.getExtentionPath(), 'resources', 'dark', 'folder.svg')
			};
		}

		this.collapsibleState = 
			hasNestedElements 
				? vscode.TreeItemCollapsibleState.Collapsed 
				: vscode.TreeItemCollapsibleState.None;
	}

	public static async create(directoryPath: string, newFolderType : ContentFolderType) : Promise<ContentFolder> {

		if(!fs.existsSync(directoryPath)) {
			throw new Error(`Директория '${directoryPath}' не существует.`);
		}

		const subDirectories = FileSystemHelper.readSubDirectories(directoryPath);
		const name = path.basename(directoryPath);

		let contentFolder: ContentFolder;
		if(subDirectories.length > 0) {
			contentFolder = new ContentFolder(name, newFolderType, true);
		} else {
			contentFolder = new ContentFolder(name, newFolderType, false);
		}

		const parentPath = path.dirname(directoryPath);
		contentFolder.setParentPath(parentPath);

		// Задаем тип директории.
		contentFolder.contextValue = ContentFolderType[newFolderType];
		return contentFolder;
	}
}