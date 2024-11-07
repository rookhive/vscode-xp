import { useTranslations } from '~/hooks/use-translations';
import { useActions, useEditor } from '../../store';
import CodeSection from '../code-section/code-section';

function InputEditor() {
  const translations = useTranslations();
  const { setInputText } = useActions();
  const { ruleType, inputText } = useEditor();

  return (
    <CodeSection
      title={
        ruleType == 'correlation'
          ? translations.CorrelationRawEvents
          : translations.NormalizationRawEvents
      }
      language="json-lines"
      code={inputText}
      setCode={setInputText}
    />
  );
}

export default InputEditor;
