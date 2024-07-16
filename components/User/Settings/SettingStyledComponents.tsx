export const StyledButton = ({
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={`
    rounded-md border border-white/20 p-2 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10
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
  <div className={`my-2 flex flex-col ${className}`}>
    <span className="mb-1 text-sm">{props.placeholder}</span>
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
  <div className={`my-2 flex flex-col items-center ${className}`}>
    <span className="mb-1 text-sm">{props.placeholder}</span>
    <input
      className="w-3 flex-1 rounded-md border border-neutral-600 bg-[#202123] px-4 py-3 pr-10 leading-3 text-white"
      type="checkbox"
      {...props}
    />
  </div>
);
