import { useState } from "react";
import AnimeCard from "./AnimeCard";

const STATUS_OPTIONS = ["All", "Watching", "Completed", "Plan to Watch"];

function Watchlist({ watchlist, onToggle, onChangeStatus, onSelectAnime, isLoggedIn }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredItems = Object.values(watchlist).filter((anime) => {
    if (activeFilter === "All") return true;
    if (anime.status === activeFilter) return true;
  });

  return (
    <>
      <div className="flex items-center gap-6 mb-6">
        <h1 className="text-2xl font-bold text-green-500">My Watchlist</h1>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                activeFilter === status
                  ? "bg-green-500 text-black"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
        {filteredItems.map((item) => (
          <AnimeCard
            key={item.anime.id}
            inWatchlist={true}
            isLoggedIn={isLoggedIn}
            onToggle={() => onToggle(item.anime)}
            status={item.status}
            anime={item.anime}
            onChangeStatus={(newStatus) => onChangeStatus(item.anime.id, newStatus)}
            onClick={() => onSelectAnime(item.anime.id)}
          />
        ))}
      </div>
    </>
  );
}

export default Watchlist;
