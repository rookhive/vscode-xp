import clsx from 'clsx';
import { useEffect, useState } from 'react';
import Tooltip from '../tooltip/tooltip';
import styles from './textfield.module.scss';

interface TextfieldProps extends React.PropsWithChildren {
  className?: string;
  type?: 'number' | 'text';
  min?: number;
  max?: number;
  value?: string | number;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  onChange(value: string): void;
  onValidate?(value: string): { isValid: boolean; errorMessage?: string };
}

function Textfield({
  className,
  type = 'text',
  min,
  max,
  value = '',
  placeholder = '',
  isDisabled = false,
  isInvalid: isInvalidControlled = false,
  errorMessage,
  onChange
}: TextfieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [innerValue, setInnerValue] = useState(value);
  const isInvalid = !!errorMessage;

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget;
    setInnerValue(value);
    onChange(value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <Tooltip title={errorMessage} variant="error">
      <div
        className={clsx(
          className,
          styles.root,
          isFocused && styles.isFocused,
          (isInvalidControlled || isInvalid) && styles.isInvalid,
          isDisabled && styles.isDisabled
        )}
      >
        <input
          title=""
          className={styles.input}
          disabled={isDisabled}
          value={innerValue}
          placeholder={placeholder}
          type={type}
          min={min}
          max={max}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </Tooltip>
  );
}

export default Textfield;
