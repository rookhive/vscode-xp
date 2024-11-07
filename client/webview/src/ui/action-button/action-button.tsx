import clsx from 'clsx';
import Icon from '../icon/icon';
import styles from './action-button.module.scss';

interface ActionButtonProps {
  iconId: string;
  isDisabled?: boolean;
  onClick?(): void;
}

function ActionButton({ iconId, isDisabled, onClick }: ActionButtonProps) {
  return (
    <button
      className={clsx(styles.root, isDisabled && styles.isDisabled)}
      tabIndex={-1}
      onClick={isDisabled ? undefined : onClick}
    >
      <Icon id={iconId} />
    </button>
  );
}

export default ActionButton;
