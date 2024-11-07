import { memo } from 'react';
import { usePostMessage } from '~/hooks/use-post-message';
import { useTranslations } from '~/hooks/use-translations';
import Button from '~/ui/button/button';
import Header from '~/ui/header/header';
import Icon from '~/ui/icon/icon';
import { useActions, useEditor } from '../../store';
import styles from './editor-header.module.scss';

function EditorHeader() {
  const translations = useTranslations();
  const postMessage = usePostMessage();
  const { inputText, expectationText, resultText, isEditorValid } = useEditor();
  const { setResultText } = useActions();

  const postSaveTestMessage = () => {
    postMessage({
      command: 'UnitTestEditor.saveTest',
      inputData: inputText,
      expectation: expectationText
    });
  };

  const postRunTestMessage = () => {
    postMessage({
      command: 'UnitTestEditor.runTest',
      inputData: inputText,
      expectation: expectationText
    });
  };

  const postUpdateExpectationMessage = () => {
    postMessage({
      command: 'UnitTestEditor.updateExpectation',
      expectation: expectationText
    });
    setResultText('');
  };

  return (
    <Header className={styles.root} title={translations.EditorTitle}>
      <div className={styles.controls}>
        <Button onClick={postSaveTestMessage}>
          <Icon id="save" />
          {translations.Save}
        </Button>
      </div>
      <div className={styles.controls}>
        <Button isDisabled={!isEditorValid} onClick={postRunTestMessage}>
          <Icon id="play" />
          {translations.Run}
        </Button>
        <Button isDisabled={!resultText} variant="secondary" onClick={postUpdateExpectationMessage}>
          {translations.ReplaceExpectedEventWithActual}
        </Button>
      </div>
    </Header>
  );
}

export default memo(EditorHeader);
