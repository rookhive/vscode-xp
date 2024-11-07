import { useCallback, useState } from 'react';
import { useMessage } from '~/hooks/use-message';
import Editor from './components/editor/editor';
import { useActions } from './store';

function UnitTestEditor() {
  const [isDataReady, setIsDataReady] = useState(false);
  const { setInputText, setExpectationText, setResultText, setRuleType } = useActions();

  useMessage(
    useCallback((message) => {
      switch (message.command) {
        case 'UnitTestEditor.setState':
          setRuleType(message.payload.ruleType);
          setInputText(message.payload.inputEvents.data);
          setExpectationText(message.payload.expectation.data);
          setIsDataReady(true);
          break;

        case 'UnitTestEditor.updateInputData':
          setInputText(message.inputData);
          break;

        case 'UnitTestEditor.updateExpectation':
          setExpectationText(message.expectation);
          break;

        case 'UnitTestEditor.updateActualData':
          setResultText(message.actualData);
          break;
      }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
  );

  return isDataReady && <Editor />;
}

export default UnitTestEditor;
