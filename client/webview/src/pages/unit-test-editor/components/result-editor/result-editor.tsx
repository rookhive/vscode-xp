import { useTranslations } from '~/hooks/use-translations';
import { useActions, useEditor } from '../../store';
import CodeSection from '../code-section/code-section';

function ResultEditor() {
  const translations = useTranslations();
  const { setResultText } = useActions();
  const { resultText } = useEditor();

  return (
    <CodeSection
      readOnly
      language="json"
      title={translations.ActualResult}
      code={resultText}
      setCode={setResultText}
    />
  );
}

export default ResultEditor;
