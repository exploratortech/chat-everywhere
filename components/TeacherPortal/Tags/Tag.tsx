import { cn } from '@/lib/utils';

const Tag = ({
  label,
  count = 0,
  onSelect,
  selected,
}: {
  label: string;
  count?: number;
  onSelect?: () => void;
  selected?: boolean;
}) => {
  return (
    <div
      className={cn(
        'hover:bg-neutral-700 border inline-flex items-center h-max bg-neutral-800 text-white text-sm font-semibold px-2.5 py-0.5 rounded-lg',
        selected ? 'bg-neutral-700' : 'border-neutral-600',
        onSelect ? 'cursor-pointer' : 'cursor-default',
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <span className="px-1.5 py-0.5 rounded mr-1">#{label}</span>
      {count > 0 && (
        <span className="text-neutral-500 font-light px-1 py-0.5 rounded">
          {count}
        </span>
      )}
    </div>
  );
};

export default Tag;
