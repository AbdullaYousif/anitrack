function AnimeCard({ anime, inWatchlist, onToggle, status, onChangeStatus, onClick }) {
  return (
    <div onClick={onClick} className="animate-card-in bg-gray-900 text-white flex flex-col rounded-xl overflow-hidden hover:cursor-pointer">
      
      <img
        className="w-full aspect-2/3 object-cover"
        src={anime.images.jpg.large_image_url}
        alt={anime.title}
      />
      <div className="p-3 flex flex-col flex-1">
        <p className="text-lg font-semibold">{anime.title}</p>
        <span className="text-green-400 font-semibold">⭐ {anime.score ? (anime.score): "N/A"}</span>

        <button onClick={(e) => {e.stopPropagation(); onToggle();}} className={`cursor-pointer mt-auto w-full py-1 rounded text-sm font-semibold ${inWatchlist ? "bg-gray-700 hover:bg-green-500" : "bg-green-500 hover:bg-green-400"}`}>
          {inWatchlist? "Remove from Watchlist" : "Add to Watchlist"}
        </button>
        {inWatchlist && <select onClick={(e)=> {e.stopPropagation();}} className=" cursor-pointer bg-gray-800 text-white text-sm rounded mt-2 w-full p-1 outline-none border border-gray-700" value={status} onChange={(e => onChangeStatus(e.target.value))} name="watchlistStatus" id="">
            <option value="Plan to Watch">Plan to Watch</option>
            <option value="Watching">Currently Watching</option>
            <option value="Completed">Completed</option>
          </select>
        }
      </div>
    </div>
  );
}
export default AnimeCard;
