import { useState } from "react";

function AnimeCard({ anime, isLoggedIn, inWatchlist, onToggle, episodesWatched, onUpdateProgress, status, onChangeStatus, onClick }) {
  const [inputValue, setInputValue] = useState(episodesWatched);

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
          <>
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
            <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-between gap-1 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); if (episodesWatched > 0) { onUpdateProgress(episodesWatched - 1); setInputValue(episodesWatched - 1); }}}
                className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded w-6 h-6 flex items-center justify-center"
              >
                −
              </button>
              <div className="flex items-center gap-0.5 flex-1 justify-center text-xs text-gray-400">
                <input
                  type="number"
                  min="0"
                  max={anime.episodes ?? undefined}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={() => {
                    const parsed = parseInt(inputValue);
                    const max = anime.episodes ?? Infinity;
                    if (!isNaN(parsed) && parsed >= 0 && parsed <= max) {
                      onUpdateProgress(parsed);
                    } else {
                      setInputValue(episodesWatched);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const parsed = parseInt(inputValue);
                    const max = anime.episodes ?? Infinity;
                    if (!isNaN(parsed) && parsed >= 0 && parsed <= max) {
                      onUpdateProgress(parsed);
                    } else {
                      setInputValue(episodesWatched);
                    }
                  }}
                  className="w-10 text-center bg-gray-800 text-white text-xs rounded border border-gray-700 outline-none py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {anime.episodes && <span>/ {anime.episodes}</span>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); const next = episodesWatched + 1; if (!anime.episodes || next <= anime.episodes) { onUpdateProgress(next); setInputValue(next); }}}
                className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded w-6 h-6 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
export default AnimeCard;
