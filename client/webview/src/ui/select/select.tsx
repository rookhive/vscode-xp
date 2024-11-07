import clsx from 'clsx';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../icon/icon';
import styles from './select.module.scss';

interface SelectProps<T> {
  selectedValue: T;
  position?: 'top' | 'bottom';
  items: { value: T; label: string }[];
  onSelect(selectedValue: T): void;
}

function Select<T extends string>({
  selectedValue,
  position = 'bottom',
  items,
  onSelect
}: SelectProps<T>) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpened, setIsOpened] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [focusedValue, setFocusedValue] = useState(selectedValue);

  useLayoutEffect(() => {
    setFocusedValue(selectedValue);
  }, [isOpened, selectedValue]);

  useEffect(() => {
    const closeDropdown = () => {
      setIsOpened(false);
      setIsFocused(false);
    };

    document.addEventListener('mousedown', closeDropdown);
    document.addEventListener('scroll', closeDropdown);
    document.addEventListener('wheel', closeDropdown);
    window.addEventListener('resize', closeDropdown);

    return () => {
      document.removeEventListener('mousedown', closeDropdown);
      document.removeEventListener('scroll', closeDropdown);
      document.removeEventListener('wheel', closeDropdown);
      window.removeEventListener('resize', closeDropdown);
    };
  }, []);

  useLayoutEffect(() => {
    const anchorNode = anchorRef.current;
    const dropdownNode = dropdownRef.current;

    if (!isOpened || !dropdownNode || !anchorNode) {
      return;
    }

    const {
      top: anchorTop,
      left: anchorLeft,
      width: anchorWidth,
      height: anchorHeight
    } = anchorNode.getBoundingClientRect();
    const { width: dropdownWidth, height: dropdownHeight } = dropdownNode.getBoundingClientRect();
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

    let deltaX = 0;
    let deltaY = 0;

    switch (position) {
      case 'bottom':
        deltaY += anchorHeight;
        break;
    }

    const top = Math.max(0, Math.min(anchorTop + deltaY, windowHeight - dropdownHeight - 2));
    const left = Math.max(0, Math.min(anchorLeft + deltaX, windowWidth - dropdownWidth));

    requestAnimationFrame(() => {
      if (dropdownRef.current) {
        Object.assign(dropdownRef.current.style, {
          top: `${top}px`,
          left: `${left}px`,
          width: `${anchorWidth}px`
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorRef.current, dropdownRef.current, position, isOpened]);

  const handleOpenToggle = () => {
    setIsFocused(!isOpened);
    setIsOpened(!isOpened);
  };

  const handleItemClick = (e: React.MouseEvent<HTMLLIElement>) => {
    onSelect(e.currentTarget.dataset.value as T);
    setIsOpened(false);
    setIsFocused(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleItemFocus = (e: React.MouseEvent<HTMLLIElement>) => {
    setFocusedValue(e.currentTarget.dataset.value as T);
  };

  const selectedLabel = useMemo(
    () => items.find(({ value }) => value === selectedValue)!.label,
    [items, selectedValue]
  );

  return (
    <>
      <div
        ref={anchorRef}
        className={clsx(styles.root, isFocused && styles.isFocused)}
        onClick={handleOpenToggle}
      >
        <div className={styles.rootItem}>{selectedLabel}</div>
        <div className={styles.expandIcon}>
          <Icon id="chevron-down" />
        </div>
      </div>
      {isOpened &&
        createPortal(
          <div ref={dropdownRef} className={styles.dropdown}>
            <ul className={styles.items}>
              {items.map(({ value, label }) => (
                <li
                  key={value}
                  className={clsx(styles.item, value === focusedValue && styles.isFocused)}
                  data-value={value}
                  onClick={handleItemClick}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleItemFocus}
                >
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}

export default Select;
