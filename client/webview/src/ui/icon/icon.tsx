import clsx from 'clsx';

interface IconProps {
  className?: string;
  id: string;
}

function Icon({ className = '', id }: IconProps) {
  return <span className={clsx('codicon', `codicon-${id}`, className)} />;
}

export default Icon;
