import { VscodeTextarea } from '@vscode-elements/react-elements';
import styles from './textarea.module.scss';

interface Props {
  value: string;
  onChange(value: string): void;
}

function Textarea({ value, onChange }: Props) {
  const handleChange = (e: Event) => {
    onChange((e.target as HTMLTextAreaElement).value);
  };

  return (
    <VscodeTextarea className={styles.root} resize="none" value={value} onChange={handleChange} />
  );
}

export default Textarea;
