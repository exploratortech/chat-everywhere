interface Props {
  onClick: any;
  className?: string;
  isOpen: boolean;
}

export const SidebarToggleButton = ({
  onClick,
  className = '',
  isOpen,
}: Props) => {
  return (
    <button
      className={` top-0 flex size-10 items-center justify-center text-neutral-700 transition-all ease-linear tablet:top-1 tablet:size-6 ${className} `}
      onClick={onClick}
    >
      <div className={` relative block size-[20px] `}>
        <div
          className={` before:absolute before:right-0 before:top-[10%] before:h-[12%] before:w-full before:rounded-[20px] before:bg-neutral-700 before:transition-all before:content-[''] after:absolute after:bottom-[10%] after:left-0 after:h-[12%] after:w-full after:rounded-[20px] after:bg-neutral-700 after:transition-all after:content-[''] before:dark:bg-white after:dark:bg-white before:tablet:bg-neutral-100 after:tablet:bg-neutral-100 ${
            isOpen ? 'before:!w-0 after:!w-0' : ''
          }`}
        >
          <div
            className={` absolute flex size-[20px] items-center before:absolute before:h-[12%] before:w-full before:rounded-[20px] before:bg-neutral-700 before:transition-all before:content-[''] after:absolute after:h-[12%] after:w-full after:rounded-[20px] after:bg-neutral-700 after:transition-all after:content-[''] before:dark:bg-white after:dark:bg-white before:tablet:bg-neutral-100 after:tablet:bg-neutral-100 ${
              isOpen ? 'before:rotate-[135deg] after:rotate-45' : ''
            } `}
          ></div>
        </div>
      </div>
    </button>
  );
};
