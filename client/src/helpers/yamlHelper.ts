import * as jsYaml from 'js-yaml';
import * as os from 'os';

export class YamlHelper {
  public static configure(dumpOptions: jsYaml.DumpOptions, loadOptions?: jsYaml.LoadOptions): void {
    this.dumpOptions = dumpOptions;
    this.loadOptions = loadOptions;
  }

  /**
   * Сериализует в строку локализацию. Отличие в принудительном обрамлении в строку и дублировании одинарных кавычек.
   * @param object объект для сериализации в строку
   * @returns
   */
  public static localizationsStringify(object: any): string {
    const localizationDumpOptions = Object.assign({}, this.dumpOptions);
    localizationDumpOptions.forceQuotes = true;

    return jsYaml.dump(object, localizationDumpOptions);
  }

  public static tableStringify(object: any): string {
    return jsYaml.dump(object, { ...this.dumpOptions, indent: 2 }).replace(/\n/g, os.EOL);
  }

  public static stringify(object: any, styles?: any): string {
    if (styles !== undefined) {
      this.dumpOptions.styles = styles;
    }

    return jsYaml.dump(object, this.dumpOptions).replace(/\n/g, os.EOL);
  }

  public static stringifyTable(object: any): string {
    return jsYaml.dump(object, {
      styles: { '!!null': 'empty' },
      lineWidth: -1,
      quotingType: '"'
    });
  }

  public static jsonToYaml(jsonStr: string): string {
    return jsYaml.dump(JSON.parse(jsonStr));
  }

  public static yamlToJson(yamlStr: string): string {
    return JSON.stringify(jsYaml.load(yamlStr, this.loadOptions));
  }

  public static parse(str: string): any {
    return jsYaml.load(str, this.loadOptions);
  }

  private static dumpOptions: jsYaml.DumpOptions;
  private static loadOptions: jsYaml.LoadOptions;
}
