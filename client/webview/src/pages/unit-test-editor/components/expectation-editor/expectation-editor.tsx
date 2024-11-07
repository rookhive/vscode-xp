import { useTranslations } from '~/hooks/use-translations';
import { useActions, useEditor } from '../../store';
import CodeSection from '../code-section/code-section';

function ExpectationEditor() {
  const translations = useTranslations();
  const { setExpectationText } = useActions();
  const { ruleType, expectationText } = useEditor();

  return (
    <CodeSection
      title={translations.ConditionForPassingTheTest}
      language={ruleType == 'correlation' ? 'xp-test-code' : 'json'}
      code={expectationText}
      setCode={setExpectationText}
    />
  );
}

export default ExpectationEditor;
