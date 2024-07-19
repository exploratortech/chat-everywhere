import type { FC } from 'react';

import type { DefaultTFuncReturn } from 'i18next';

interface Props {
  text?: string | DefaultTFuncReturn;
  className?: string;
  icon: JSX.Element;
  suffixIcon?: JSX.Element;
  'data-cy'?: string; // Corrected line
  onClick: () => void;
}

export const SidebarButton: FC<Props> = ({
  text = '',
  className = '',
  icon,
  suffixIcon,
  'data-cy': dataCy,
  onClick,
}) => {
  return (
    <button
      className={`flex w-full cursor-pointer select-none items-center justify-between rounded-md p-3 text-[14px] leading-3 text-white transition-colors duration-200 hover:bg-gray-500/10 ${className}`}
      data-cy={dataCy}
      onClick={onClick}
    >
      <div className="flex flex-row items-center gap-3">
        <div>{icon}</div>
        {text && <span>{text}</span>}
      </div>
      {suffixIcon && <span>{suffixIcon}</span>}
    </button>
  );
};
