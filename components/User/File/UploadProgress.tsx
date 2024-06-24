export function UploadProgress({ progressNumber }: { progressNumber: number }) {
  return (
    <div className="">
      <div className="flex mb-2 items-center justify-center">
        <span className="text-xs font-semibold inline-block text-white">
          {progressNumber}%
        </span>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#e0e0e0]">
        <div
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-black"
          style={{
            width: `${progressNumber}%`,
          }}
        />
      </div>
    </div>
  );
}
