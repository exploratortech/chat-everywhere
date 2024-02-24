const Tag = ({ label, count }: { label: string; count: number }) => {
  return (
    <div className="inline-flex items-center h-max bg-neutral-800 text-white text-sm font-semibold px-2.5 py-0.5 border border-neutral-600 rounded-lg">
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
