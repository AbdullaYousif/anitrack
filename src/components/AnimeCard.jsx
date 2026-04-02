function AnimeCard({ anime, isLoggedIn, inWatchlist, onToggle, status, onChangeStatus, onClick }) {
  return (
    <div
      onClick={onClick}
      className="animate-card-in group bg-gray-900 text-white flex flex-col rounded-lg overflow-hidden transition-transform duration-200 hover:scale-105 cursor-pointer"
    >
      <div className="relative">
        <img
          className="w-full aspect-2/3 object-cover"
          src={anime.images.jpg.large_image_url}
          alt={anime.title}
        />
        {anime.score && (
          <span className="absolute top-2 left-2 bg-black/70 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
            ⭐ {anime.score}
          </span>
        )}
      </div>
      <div className="p-2 flex flex-col flex-1 gap-1">
        <p className="text-xs font-semibold leading-tight line-clamp-2">{anime.title}</p>
        {isLoggedIn && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`cursor-pointer mt-auto w-full py-1 rounded text-xs font-semibold ${inWatchlist ? "bg-gray-700 hover:bg-red-500" : "bg-green-500 hover:bg-green-400"}`}
          >
            {inWatchlist ? "Remove" : "+ Watchlist"}
          </button>
        )}
        {inWatchlist && (
          <select
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer bg-gray-800 text-white text-xs rounded w-full p-1 outline-none border border-gray-700"
            value={status}
            onChange={(e) => onChangeStatus(e.target.value)}
          >
            <option value="Plan to Watch">Plan to Watch</option>
            <option value="Watching">Currently Watching</option>
            <option value="Completed">Completed</option>
          </select>
        )}
      </div>
    </div>
  );
}
export default AnimeCard;
