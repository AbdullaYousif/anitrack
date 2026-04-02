function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden animate-pulse">
      <div className="bg-gray-700 w-full aspect-2/3" />
      <div className="p-2 flex flex-col gap-1">
        <div className="bg-gray-700 rounded h-3 w-3/4" />
        <div className="bg-gray-700 rounded h-3 w-1/2" />
        <div className="bg-gray-700 rounded h-6 w-full mt-1" />
      </div>
    </div>
  );
}

export default SkeletonCard;
