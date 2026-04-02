function SkeletonCard() {
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden animate-pulse">
      <div className="bg-gray-700 w-full aspect-2/3" />
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="bg-gray-700 rounded h-5 w-3/4" />
        <div className="bg-gray-700 rounded h-4 w-1/4" />
        <div className="bg-gray-700 rounded h-8 w-full mt-auto" />
      </div>
    </div>
  );
}

export default SkeletonCard;
