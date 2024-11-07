import clsx from 'clsx';
import { ComponentPropsWithoutRef } from 'react';
import styles from './setting-box.module.scss';

function SettingBox({ children, className }: ComponentPropsWithoutRef<'div'>) {
  return <div className={clsx(styles.root, className)}>{children}</div>;
}

export default SettingBox;
