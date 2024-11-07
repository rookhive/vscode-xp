import clsx from 'clsx';
import styles from './header.module.scss';

interface HeaderProps extends React.PropsWithChildren {
  className?: string;
  title: React.ReactNode;
}

function Header({ className, title, children }: HeaderProps) {
  return (
    <header className={clsx(styles.root, className)}>
      <h1>{title}</h1>
      {children}
    </header>
  );
}

export default Header;
