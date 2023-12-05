export const StyledButton = ({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`
    rounded-md border border-white/20 p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10
      ${className}
    `}
    {...props}
  >
    {children}
  </button>
);

export const StyledInput = ({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={`flex flex-col my-2 ${className}`}>
    <span className="text-sm mb-1">{props.placeholder}</span>
    <input
      className="flex-1 rounded-md border border-neutral-600 bg-[#202123] px-4 py-3 pr-10 text-[14px] leading-3 text-white"
      type="text"
      {...props}
    />
  </div>
);

export const StyledToggle = ({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className={`flex flex-col my-2 items-center ${className}`}>
    <span className="text-sm mb-1">{props.placeholder}</span>
    <input
      className="flex-1 rounded-md border border-neutral-600 bg-[#202123] px-4 py-3 pr-10 leading-3 text-white w-3"
      type="checkbox"
      {...props}
    />
  </div>
);
