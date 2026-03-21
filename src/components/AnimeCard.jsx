import React from "react";

function AnimeCard({ anime, inWatchlist, onToggle, status, onChangeStatus }) {
  return (
    <div className="bg-gray-900 text-white flex flex-col rounded-xl overflow-hidden ">
      <img
        className="w-full aspect-2/3 object-cover"
        src={anime.images.jpg.large_image_url}
        alt={anime.title}
      />
      <div className="p-3 flex flex-col flex-1">
        <p className="text-lg font-semibold line-clamp-2">{anime.title}</p>
        <p className="text-base text-gray-500">{anime.score ?? "N/A"}</p>

        <button onClick={onToggle} className={` cursor-pointer mt-auto w-full py-1 rounded text-sm font-semibold ${inWatchlist ? "bg-gray-700 hover:bg-red-500" : "bg-sky-500 hover:bg-sky-400"}`}>
          {inWatchlist? "Remove from Watchlist" : "Add to Watchlist"}
        </button>
        {inWatchlist && <select className=" cursor-pointer bg-gray-800 text-white text-sm rounded mt-2 w-full p-1 outline-none border border-gray-700" value={status} onChange={(e => onChangeStatus(e.target.value))} name="watchlistStatus" id="">
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
