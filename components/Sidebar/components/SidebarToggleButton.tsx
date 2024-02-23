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
      className={` w-10 h-10 tablet:w-6 tablet:h-6 tablet:top-1 flex justify-center items-center top-0 transition-all ease-linear text-neutral-700 ${className} `}
      onClick={onClick}
    >
      <div className={` block relative w-[20px] h-[20px] `}>
        <div
          className={` before:content-[''] before:absolute before:w-full before:h-[12%] before:bg-neutral-700 before:tablet:bg-neutral-100 before:dark:bg-white before:rounded-[20px] before:transition-all before:top-[10%] before:right-0 after:content-[''] after:absolute after:w-full after:h-[12%] after:bg-neutral-700 after:tablet:bg-neutral-100 after:dark:bg-white after:rounded-[20px] after:transition-all after:bottom-[10%] after:left-0 ${
            isOpen ? 'before:!w-0 after:!w-0' : ''
          }`}
        >
          <div
            className={` absolute flex items-center h-[20px] w-[20px] before:content-[''] before:absolute before:w-full before:h-[12%] before:bg-neutral-700 before:tablet:bg-neutral-100 before:dark:bg-white before:rounded-[20px] before:transition-all after:content-[''] after:absolute after:w-full after:h-[12%] after:bg-neutral-700 after:tablet:bg-neutral-100 after:dark:bg-white after:rounded-[20px] after:transition-all ${
              isOpen ? 'before:rotate-[135deg] after:rotate-[45deg]' : ''
            } `}
          ></div>
        </div>
      </div>
    </button>
  );
};
