import clsx from 'clsx';
import { cloneElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './tooltip.module.scss';

interface TooltipProps {
  title: React.ReactNode;
  position?: 'bottom' | 'top';
  variant?: 'info' | 'error';
  children: React.ReactElement;
}

function Tooltip({ children, title, position = 'bottom', variant = 'info' }: TooltipProps) {
  const anchorRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    if (!anchorRef.current) {
      return;
    }

    const anchorNode = anchorRef.current;

    const showTooltip = () => setIsShown(true);
    const hideTooltip = () => setIsShown(false);

    anchorNode.addEventListener('mouseenter', showTooltip);
    anchorNode.addEventListener('mouseleave', hideTooltip);
    document.addEventListener('mousedown', hideTooltip);
    document.addEventListener('scroll', hideTooltip);
    document.addEventListener('wheel', hideTooltip);
    window.addEventListener('resize', hideTooltip);

    return () => {
      anchorNode?.removeEventListener('mouseenter', showTooltip);
      anchorNode?.removeEventListener('mouseleave', hideTooltip);
      document.removeEventListener('mousedown', hideTooltip);
      document.removeEventListener('scroll', hideTooltip);
      document.removeEventListener('wheel', hideTooltip);
      window.removeEventListener('resize', hideTooltip);
    };
  }, [anchorRef.current, title]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const anchorNode = anchorRef.current;
    const tooltipNode = tooltipRef.current;

    if (!isShown || !tooltipNode || !anchorNode) {
      return;
    }

    const offsetX = 6;
    const offsetY = 6;

    const {
      top: anchorTop,
      left: anchorLeft,
      width: anchorWidth,
      height: anchorHeight
    } = anchorNode.getBoundingClientRect();
    const { width: tooltipWidth, height: tooltipHeight } = tooltipNode.getBoundingClientRect();
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;

    let deltaX = 0;
    let deltaY = 0;

    switch (position) {
      case 'top':
        deltaX += (anchorWidth - tooltipWidth) / 2;
        deltaY -= tooltipHeight;
        break;
      case 'bottom':
        deltaX += (anchorWidth - tooltipWidth) / 2;
        deltaY += anchorHeight;
        break;
    }

    const top = Math.max(
      offsetY,
      Math.min(anchorTop + deltaY, windowHeight - tooltipHeight - offsetY)
    );
    const left = Math.max(
      offsetX,
      Math.min(anchorLeft + deltaX, windowWidth - tooltipWidth - offsetX)
    );

    let pointerOffset = tooltipWidth / 2 - anchorWidth / 2 - anchorLeft + left;
    const pointerWidth = 6;
    const maxPointerOffset = tooltipWidth / 2 - pointerWidth;

    if (Math.abs(pointerOffset) > Math.abs(maxPointerOffset)) {
      pointerOffset = Math.sign(pointerOffset) * maxPointerOffset;
    }

    requestAnimationFrame(() => {
      if (!tooltipRef.current) {
        return;
      }
      tooltipRef.current.style.setProperty('--pointer-offset', `${0 - pointerOffset}px`);
      Object.assign(tooltipRef.current.style, {
        top: `${top}px`,
        left: `${left}px`
      });
    });
  }, [anchorRef.current, title, position, isShown]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {title ? cloneElement(children, { ref: anchorRef }) : children}
      {!!title &&
        isShown &&
        createPortal(
          <div
            ref={tooltipRef}
            className={clsx(styles.root, styles[position], isShown && styles.isShown, {
              [styles.isError]: variant == 'error'
            })}
          >
            <div className={styles.content}>{title}</div>
            <div className={styles.pointer} />
          </div>,
          document.body
        )}
    </>
  );
}

export default Tooltip;
