import "./index.css";
import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import luffyImg from "../public/one-piece-luffy-thumbs-up.png";
import {
  getSeasonalAnime,
  getTopAnime,
  searchAnime,
  getCurrentSeason,
} from "./api/anilist";
import AnimeCard from "./components/AnimeCard";
import SkeletonCard from "./components/SkeletonCard";
import AnimeDetail from "./components/AnimeDetail";
import Modal from "./components/Modal";
import Toast from "./components/Toast";
import Watchlist from "./components/Watchlist";

function sortAnime(items, sortBy) {
  switch (sortBy) {
    case "title-asc":
      return [...items].sort((a, b) => a.title.localeCompare(b.title));
    case "title-desc":
      return [...items].sort((a, b) => b.title.localeCompare(a.title));
    case "score-asc":
      return [...items].sort((a, b) => {
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return a.score - b.score;
      });
    case "score-desc":
      return [...items].sort((a, b) => {
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return b.score - a.score;
      });
    default:
      return items;
  }
}

function SortSelect({ sortBy, setSortBy }) {
  return (
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      className="cursor-pointer bg-gray-800 text-xs rounded-full px-3 py-1 outline-none border-none font-semibold text-gray-400 hover:text-white ml-auto"
    >
      <option value="score-desc">Score ↓</option>
      <option value="score-asc">Score ↑</option>
      <option value="title-asc">Title A–Z</option>
      <option value="title-desc">Title Z–A</option>
    </select>
  );
}

function App() {
  const [searchResult, setSearchResult] = useState([]);
  const seasonalFilter = ["WINTER", "SPRING", "SUMMER", "FALL"];
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("One Piece");
  const [seasonal, setSeasonal] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const cacheRef = useRef({});
  const sentinelRef = useRef(null);
  const [modalStatus, setModalStatus] = useState(false);
  const [modalType, setModalType] = useState("login");
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState("score-desc");
  const [toastMessage, setToastMessage] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [userID, setUserID] = useState(() => {
    const saved = localStorage.getItem("userID");
    return saved ? saved : null;
  });
  const [username, setUsername] = useState(() => {
    const saved = localStorage.getItem("username");
    return saved ? saved : null;
  });
  const [userToken, setUserToken] = useState(() => {
    const saved = localStorage.getItem("userToken");
    return saved ? saved : null;
  });

  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem("watchlist");
    return saved ? JSON.parse(saved) : {};
  });

  async function toggleWatchlist(anime) {
    if (watchlist[anime.id]) {
      setWatchlist((current) => {
        const { [anime.id]: _, ...rest } = current;
        return rest;
      });
      await fetch(`${import.meta.env.VITE_API_URL}/watchlist/${anime.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      });
      showToast("Removed From Watchlist");
    } else {
      setWatchlist({
        ...watchlist,
        [anime.id]: { anime, status: "Plan to Watch" },
      });
      showToast(`Added ${anime.title} to Watchlist`);
      await fetch(`${import.meta.env.VITE_API_URL}/watchlist/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userID,
          anime_id: anime.id,
          anime_data: anime,
          status: "Plan to Watch",
        }),
      });
    }
  }

  function handleAuthSuccess(userToken, username, user_id) {
    setUserToken(userToken);
    localStorage.setItem("userToken", userToken);
    setModalStatus(false);
    setUsername(username);
    localStorage.setItem("username", username);
    setUserID(user_id);
    localStorage.setItem("userID", user_id);
  }

  async function updateProgress(anime_id, newCount) {
    setWatchlist({
      ...watchlist,
      [anime_id]: { ...watchlist[anime_id], episodes_watched: newCount },
    });
    await fetch(`${import.meta.env.VITE_API_URL}/watchlist/${anime_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ episodes_watched: newCount }),
    });
  }

  async function changeStatus(anime_id, newStatus) {
    setWatchlist({
      ...watchlist,
      [anime_id]: { ...watchlist[anime_id], status: newStatus },
    });
    await fetch(`${import.meta.env.VITE_API_URL}/watchlist/${anime_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (userToken) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/watchlist/${userID}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${userToken}` },
        });
        const data = await res.json();
        const result = {};
        data.forEach((row) => {
          result[row.anime_id] = {
            anime: row.anime_data,
            status: row.status,
            episodes_watched: row.episodes_watched,
          };
        });
        setWatchlist(result);
      }
    };
    fetchWatchlist();
  }, [userID, userToken]);

  // Search
  useEffect(() => {
    if (activeTab !== "search") return;
    let canceled = false;
    const timer = setTimeout(() => {
      const fetchAnime = async () => {
        const cacheKey = `${searchQuery}-${currentPage}`;
        if (cacheRef.current[cacheKey]) {
          const cached = cacheRef.current[cacheKey];
          if (currentPage === 1) setSearchResult(cached.media);
          else setSearchResult((prev) => [...prev, ...cached.media]);
          setHasNextPage(cached.pageInfo.hasNextPage);
          return;
        }
        if (currentPage === 1) flushSync(() => setIsLoading(true));
        const data = await searchAnime(searchQuery, currentPage);
        if (canceled) return;
        cacheRef.current[cacheKey] = data;
        if (currentPage === 1) setSearchResult(data.media);
        else setSearchResult((prev) => [...prev, ...data.media]);
        setHasNextPage(data.pageInfo.hasNextPage);
        setIsLoading(false);
      };
      fetchAnime();
    }, 150);
    return () => { clearTimeout(timer); canceled = true; };
  }, [searchQuery, currentPage, activeTab]);

  // Seasonal
  useEffect(() => {
    if (activeTab !== "seasonal") return;
    const fetchSeasonal = async () => {
      try {
        setFetchError(null);
        if (currentPage === 1) setIsLoading(true);
        const cacheKey = `seasonal-${selectedSeason}-${selectedYear}-${currentPage}`;
        if (cacheRef.current[cacheKey]) {
          const cached = cacheRef.current[cacheKey];
          if (currentPage === 1) setSeasonal(cached.media);
          else setSeasonal((prev) => [...prev, ...cached.media]);
          setHasNextPage(cached.pageInfo.hasNextPage);
          setIsLoading(false);
          return;
        }
        const data = await getSeasonalAnime(currentPage, selectedSeason, selectedYear);
        cacheRef.current[cacheKey] = data;
        if (currentPage === 1) setSeasonal(data.media);
        else setSeasonal((prev) => [...prev, ...data.media]);
        setHasNextPage(data.pageInfo.hasNextPage);
      } catch {
        setFetchError("Failed to load seasonal anime. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeasonal();
  }, [currentPage, activeTab, selectedSeason, selectedYear]);

  // Top
  useEffect(() => {
    if (activeTab !== "top") return;
    const fetchTop = async () => {
      try {
        setFetchError(null);
        if (currentPage === 1) setIsLoading(true);
        const cacheKey = `top-${currentPage}`;
        if (cacheRef.current[cacheKey]) {
          const cached = cacheRef.current[cacheKey];
          if (currentPage === 1) setTopAnime(cached.media);
          else setTopAnime((prev) => [...prev, ...cached.media]);
          setHasNextPage(cached.pageInfo.hasNextPage);
          setIsLoading(false);
          return;
        }
        const data = await getTopAnime(currentPage);
        cacheRef.current[cacheKey] = data;
        if (currentPage === 1) setTopAnime(data.media);
        else setTopAnime((prev) => [...prev, ...data.media]);
        setHasNextPage(data.pageInfo.hasNextPage);
      } catch {
        setFetchError("Failed to load anime. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTop();
  }, [currentPage, activeTab]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isLoading) {
        setCurrentPage((p) => p + 1);
      }
    });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isLoading, activeTab]);

  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8 overflow-x-hidden">
      <h1 className="text-3xl font-bold text-green-500 mb-2">AniTrack</h1>
      <div id="nav-bar" className="flex flex-col gap-2 mb-8">
        <div className="flex gap-1 sm:gap-6 overflow-x-auto scrollbar-none">
          <button
              className={`px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${activeTab === "watchlist" ? "border-green-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}
              onClick={() => setActiveTab("watchlist")}
            >
              My Watchlist
            </button>
          <button
            className={`cursor-pointer px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${activeTab === "search" ? "border-green-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}
            onClick={() => { setActiveTab("search"); setCurrentPage(1); }}
          >
            Search
          </button>
          <button
            className={`cursor-pointer px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${activeTab === "seasonal" ? "border-green-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}
            onClick={() => { setActiveTab("seasonal"); setCurrentPage(1); }}
          >
            Seasonal
          </button>
          <button
            className={`cursor-pointer px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${activeTab === "top" ? "border-green-500 text-white" : "border-transparent text-gray-400 hover:text-white"}`}
            onClick={() => { setActiveTab("top"); setCurrentPage(1); }}
          >
            Top Anime
          </button>
        </div>
        <div className="flex gap-4 items-center">
          {!userToken && (
            <button
              className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
              onClick={() => { setModalStatus(true); setModalType("register"); }}
            >
              Sign Up
            </button>
          )}
          {!userToken && (
            <button
              className="cursor-pointer px-4 py-2 text-sm font-semibold bg-green-500 hover:bg-green-500 rounded-lg"
              onClick={() => { setModalStatus(true); setModalType("login"); }}
            >
              Login
            </button>
          )}
          {userToken && (
            <>
              <span className="text-gray-400 text-sm">
                <span className="text-white font-semibold">{username}</span>
              </span>
              <button
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
                onClick={() => { setUserToken(null); setUsername(null); setUserID(null); localStorage.removeItem("userToken"); localStorage.removeItem("username"); localStorage.removeItem("userID"); localStorage.removeItem("watchlist"); setWatchlist({}); }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-gray-400 mb-8">Never lose track of your favourite shows</p>

      {activeTab === "search" && (
        <>
          <div className="relative w-full max-w-96">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="search-box"
              className="w-full bg-gray-900 text-white text-sm pl-9 pr-4 py-2 rounded-lg outline-none border border-transparent focus:border-green-500 transition-colors"
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search anime..."
            />
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
              {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : searchResult.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-gray-500 gap-3">
              Sorry, No More Content! Click the button below to see our seasonal anime!
              <button
                onClick={() => { setActiveTab("seasonal"); setCurrentPage(1); }}
                className="cursor-pointer px-4 py-2 text-sm text-black font-semibold bg-green-500 hover:bg-green-500 rounded-lg"
              >
                Click Here
              </button>
              <img src={luffyImg} className="w-64 sm:w-96 mx-auto" alt="Luffy Image" />
            </div>
          ) : (
            <>
              <div className="flex mb-2"><SortSelect sortBy={sortBy} setSortBy={setSortBy} /></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
                {sortAnime(searchResult, sortBy).map((anime) => (
                  <AnimeCard
                    key={anime.id}
                    anime={anime}
                    isLoggedIn={!!userToken}
                    inWatchlist={!!watchlist[anime.id]}
                    onToggle={() => toggleWatchlist(anime)}
                    onChangeStatus={(newStatus) => changeStatus(anime.id, newStatus)}
                    episodesWatched={watchlist[anime.id]?.episodes_watched ?? 0}
                    onUpdateProgress={(newCount) => updateProgress(anime.id, newCount)}
                    onClick={() => setSelectedAnime(anime.id)}
                  />
                ))}
              </div>
              <div ref={sentinelRef} className="h-8" />
            </>
          )}
        </>
      )}

      {activeTab === "watchlist" && (
        <Watchlist
          watchlist={watchlist}
          onToggle={toggleWatchlist}
          onChangeStatus={changeStatus}
          onUpdateProgress={updateProgress}
          onSelectAnime={setSelectedAnime}
          isLoggedIn={!!userToken}
          onLoginClick={() => { setModalStatus(true); setModalType("login"); }}
        />
      )}

      {activeTab === "seasonal" && (
        <>
          <div className="flex flex-col gap-2 mb-6">
            <h1 className="text-2xl font-bold text-green-500">
              {selectedSeason.charAt(0) + selectedSeason.slice(1).toLowerCase()} {selectedYear}
            </h1>
            <div className="flex items-center gap-2">
              {seasonalFilter.map((season) => (
                <button
                  key={season}
                  onClick={() => { setSelectedSeason(season); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${selectedSeason === season ? "bg-green-500 text-black" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  {season.charAt(0) + season.slice(1).toLowerCase()}
                </button>
              ))}
              <div className="w-px h-4 bg-gray-700 mx-1" />
              <select
                value={selectedYear}
                onChange={(e) => { const year = parseInt(e.target.value); setSelectedYear(year); setCurrentPage(1); }}
                className="cursor-pointer bg-gray-800 text-xs rounded-full px-3 py-1 outline-none border-none font-semibold text-gray-400 hover:text-white"
              >
                {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i)
                  .reverse().map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
          </div>
          <div className="flex mb-2"><SortSelect sortBy={sortBy} setSortBy={setSortBy} /></div>
          {fetchError && <p className="text-red-400 text-sm mt-4">{fetchError}</p>}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
              {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
            {sortAnime(seasonal, sortBy).map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                isLoggedIn={!!userToken}
                inWatchlist={!!watchlist[anime.id]}
                onToggle={() => toggleWatchlist(anime)}
                onChangeStatus={(newStatus) => changeStatus(anime.id, newStatus)}
                episodesWatched={watchlist[anime.id]?.episodes_watched ?? 0}
                onUpdateProgress={(newCount) => updateProgress(anime.id, newCount)}
                onClick={() => setSelectedAnime(anime.id)}
              />
            ))}
          </div>
          )}
          <div ref={sentinelRef} className="h-8" />
        </>
      )}

      {activeTab === "top" && (
        <>
          <div className="flex mb-2"><SortSelect sortBy={sortBy} setSortBy={setSortBy} /></div>
          {fetchError && <p className="text-red-400 text-sm mt-4">{fetchError}</p>}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
              {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
            {sortAnime(topAnime, sortBy).map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                isLoggedIn={!!userToken}
                inWatchlist={!!watchlist[anime.id]}
                onToggle={() => toggleWatchlist(anime)}
                onChangeStatus={(newStatus) => changeStatus(anime.id, newStatus)}
                episodesWatched={watchlist[anime.id]?.episodes_watched ?? 0}
                onUpdateProgress={(newCount) => updateProgress(anime.id, newCount)}
                onClick={() => setSelectedAnime(anime.id)}
              />
            ))}
          </div>
          )}
          <div ref={sentinelRef} className="h-8" />
        </>
      )}

      {modalStatus && (
        <Modal
          type={modalType}
          onClose={() => setModalStatus(false)}
          onAuthSuccess={handleAuthSuccess}
          onSwitchType={() => setModalType(modalType === "login" ? "register" : "login")}
        />
      )}
      {selectedAnime && (
        <AnimeDetail id={selectedAnime} onClose={() => setSelectedAnime(null)} />
      )}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}

export default App;
