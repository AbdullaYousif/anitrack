import { useState } from "react";
import AnimeCard from "./AnimeCard";

const STATUS_OPTIONS = ["All", "Watching", "Completed", "Plan to Watch"];

const PLACEHOLDER_CARDS = Array.from({ length: 6 });

function Watchlist({
  watchlist,
  onToggle,
  onChangeStatus,
  onUpdateProgress,
  onSelectAnime,
  isLoggedIn,
  onLoginClick,
}) {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredItems = Object.values(watchlist).filter((anime) => {
    if (activeFilter === "All") return true;
    if (anime.status === activeFilter) return true;
  });

  if (!isLoggedIn) {
    return (
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4 blur-sm">
          {PLACEHOLDER_CARDS.map((_, i) => (
            <div key={i} className="aspect-2/3 rounded-lg bg-gray-800"></div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 flex flex-col items-center gap-4 text-center">
            <p className="text-white font-semibold text-lg">
              Track your anime journey
            </p>
            <p className="text-gray-400 text-sm">
              Login to view and manage your watchlist
            </p>
            <button
              onClick={onLoginClick}
              className="px-6 py-2 bg-green-500 text-black font-semibold rounded-lg text-sm cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-green-500">My Watchlist</h1>
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
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
      {filteredItems.length === 0 && (
        <p className="text-gray-500 text-sm mt-8 text-center">
          {activeFilter === "All"
            ? "Your watchlist is empty. Add some anime!"
            : `Nothing marked as "${activeFilter}" yet.`}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
        {filteredItems.map((item) => (
          <AnimeCard
            key={item.anime.id}
            inWatchlist={true}
            isLoggedIn={isLoggedIn}
            onToggle={() => onToggle(item.anime)}
            status={item.status}
            episodesWatched={item.episodes_watched ?? 0}
            anime={item.anime}
            onChangeStatus={(newStatus) =>
              onChangeStatus(item.anime.id, newStatus)
            }
            onUpdateProgress={(newCount) =>
              onUpdateProgress(item.anime.id, newCount)
            }
            onClick={() => onSelectAnime(item.anime.id)}
          />
        ))}
      </div>
    </>
  );
}

export default Watchlist;
