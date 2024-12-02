declare interface Window {
  // These values are passed to the webviews in the WebviewHtmlProvider class
  __webview: {
    // Initial page that should be opened in the webview
    initialPage: string;
    // Uri of the webview folder
    webviewRootUri: string;
    // Monaco Editor configuration with user's preferences
    monacoEditorConfiguration: editor.IStandaloneEditorConstructionOptions;
    // Translations of the UI components text content
    translations: Record<string, string>;
  };
}
