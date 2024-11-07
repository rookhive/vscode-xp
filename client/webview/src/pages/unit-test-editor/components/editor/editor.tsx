import EditorHeader from '../editor-header/editor-header';
import ExpectationEditor from '../expectation-editor/expectation-editor';
import InputEditor from '../input-editor/input-editor';
import ResultEditor from '../result-editor/result-editor';
import styles from './editor.module.scss';

function Editor() {
  return (
    <div className={styles.root}>
      <EditorHeader />
      <div className={styles.content}>
        <section className={styles.section}>
          <InputEditor />
        </section>
        <section className={styles.section}>
          <ExpectationEditor />
          <ResultEditor />
        </section>
      </div>
    </div>
  );
}

export default Editor;
