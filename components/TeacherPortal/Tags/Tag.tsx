import { cn } from '@/lib/utils';

const Tag = ({
  label,
  count,
  onSelect,
  selected,
}: {
  label: string;
  count: number;
  onSelect: () => void;
  selected: boolean;
}) => {
  return (
    <div
      className={cn(
        'cursor-pointer hover:bg-neutral-700 border inline-flex items-center h-max bg-neutral-800 text-white text-sm font-semibold px-2.5 py-0.5 rounded-lg',
        selected ? 'bg-neutral-700' : 'border-neutral-600',
      )}
      onClick={onSelect}
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
