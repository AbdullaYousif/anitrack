import React from "react";

function AnimeCard({ anime, inWatchlist, onToggle }) {
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

        <button onClick={onToggle} className={` mt-auto w-full py-1 rounded text-sm font-semibold ${inWatchlist ? "bg-gray-700 hover:bg-red-500" : "bg-sky-500 hover:bg-sky-400"}`}>
          {inWatchlist? "Remove from Watchlist" : "Add to Watchlist"}
        </button>
      </div>
    </div>
  );
}
export default AnimeCard;
