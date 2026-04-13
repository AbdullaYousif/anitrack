import "./index.css";
import { useState, useEffect, useRef} from "react";
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
  const [modalStatus, setModalStatus] = useState(false);
  const [modalType, setModalType] = useState("login");
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState("score-desc");
  const [toastMessage, setToastMessage] = useState(null);
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
      await fetch(`http://localhost:3000/watchlist/${anime.id}`, {
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
      await fetch(`http://localhost:3000/watchlist/`, {
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
    await fetch(`http://localhost:3000/watchlist/${anime_id}`, {
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
    await fetch(`http://localhost:3000/watchlist/${anime_id}`, {
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
        const res = await fetch(`http://localhost:3000/watchlist/${userID}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
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

  useEffect(() => {
    if (activeTab !== "search") return;
    let canceled = false;
    const timer = setTimeout(() => {
      const fetchAnime = async () => {
        if (cacheRef.current[`${searchQuery}-${currentPage}`]) {
          const cached = cacheRef.current[`${searchQuery}-${currentPage}`];
          setSearchResult(cached.media);
          setTotalPages(cached.pageInfo.lastPage);
          setHasNextPage(cached.pageInfo.hasNextPage);
          return;
        }
        flushSync(() => setIsLoading(true));
        const data = await searchAnime(searchQuery, currentPage);
        if (canceled) {
          return;
        }
        cacheRef.current[`${searchQuery}-${currentPage}`] = data;
        setSearchResult(data.media);
        setTotalPages(data.pageInfo.lastPage);
        setHasNextPage(data.pageInfo.hasNextPage);
        setIsLoading(false);
      };
      fetchAnime();
    }, 150);
    return () => {
      clearTimeout(timer);
      canceled = true;
    }; //if query changes before 500m, cancel the timer
  }, [searchQuery, currentPage, activeTab]);

  async function loadSeasonalAnime(
    page = 1,
    season = selectedSeason,
    year = selectedYear,
  ) {
    const cacheKey = `seasonal-${season}-${year}-${page}`;
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setSeasonal(cached.media);
      setTotalPages(cached.pageInfo.lastPage);
      setHasNextPage(cached.pageInfo.hasNextPage);
      return;
    }
    const data = await getSeasonalAnime(page, season, year);
    cacheRef.current[cacheKey] = data;
    setSeasonal(data.media);
    setTotalPages(data.pageInfo.lastPage);
    setHasNextPage(data.pageInfo.hasNextPage);
  }

  async function loadTopAnime(page = 1) {
    const cacheKey = `top -${page}`;
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setTopAnime(cached.media);
      setTotalPages(cached.pageInfo.lastPage);
      setHasNextPage(cached.pageInfo.hasNextPage);
      return;
    }
    const data = await getTopAnime(page);
    cacheRef.current[cacheKey] = data;
    setTopAnime(data.media);
    setTotalPages(data.pageInfo.lastPage);
    setHasNextPage(data.pageInfo.hasNextPage);
  }
  function showToast(message) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">AniTrack</h1>
      <div id="nav-bar" className="flex gap-6 mb-8">
        {userToken && (
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
              activeTab === "watchlist"
                ? "border-green-500 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("watchlist")}
          >
            My Watchlist
          </button>
        )}
        <button
          className={`cursor-pointer px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "search"
              ? "border-green-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => {
            setActiveTab("search");
            setCurrentPage(1);
          }}
        >
          Search
        </button>

        <button
          className={` cursor-pointer px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "seasonal"
              ? "border-green-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => {
            setActiveTab("seasonal");
            setCurrentPage(1);
            loadSeasonalAnime(1);
          }}
        >
          Seasonal Anime
        </button>

        <button
          className={` cursor-pointer px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "top"
              ? "border-green-500 text-white cursor-pointer"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => {
            setActiveTab("top");
            setCurrentPage(1);
            loadTopAnime(1);
          }}
        >
          Top Anime
        </button>
        <div className="ml-auto flex gap-4 items-center">
          {!userToken && (
            <button
              className="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
              onClick={() => {
                setModalStatus(true);
                setModalType("register");
              }}
            >
              Sign Up
            </button>
          )}
          {!userToken && (
            <button
              className="cursor-pointer px-4 py-2 text-sm font-semibold bg-green-500 hover:bg-green-500 rounded-lg"
              onClick={() => {
                setModalStatus(true);
                setModalType("login");
              }}
            >
              Login
            </button>
          )}
          {userToken && (
            <>
              <span className="cursor-pointer text-gray-400 text-sm">
                {" "}
                <span className="text-white font-semibold">{username}</span>
              </span>
              <button
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
                onClick={() => {
                  setUserToken(null);
                  setUsername(null);
                  localStorage.removeItem("userToken");
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
      <p className="text-gray-400 mb-8">
        Never lose track of your favourite shows
      </p>
      {activeTab === "search" && (
        <>
          <input
            id="search-box"
            className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg outline-none"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
          <div className="flex gap-2 mt-4 justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (pageNum) =>
                  pageNum >= currentPage - 1 &&
                  pageNum <= currentPage + (hasNextPage ? 4 : 0),
              )
              .map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${currentPage === pageNum ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  {pageNum}
                </button>
              ))}
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : searchResult.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-gray-500 gap-3">
              Sorry, No More Content! Click the button below to see our seasonal
              anime!
              <button
                onClick={() => {
                  setActiveTab("seasonal");
                  setCurrentPage(1);
                  loadSeasonalAnime(1);
                }}
                className="cursor-pointer px-4 py-2 text-sm text-black font-semibold bg-green-500 hover:bg-green-500 rounded-lg"
              >
                Click Here
              </button>
              <img
                src={luffyImg}
                width={500}
                style={{ transform: "translate(110px" }}
                alt="Luffy Image"
              />
            </div>
          ) : (
            <>
              <div className="flex mb-2">
                <SortSelect sortBy={sortBy} setSortBy={setSortBy} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
                {sortAnime(searchResult, sortBy).map((anime) => {
                  return (
                    <AnimeCard
                      key={anime.id}
                      anime={anime}
                      isLoggedIn={!!userToken}
                      inWatchlist={!!watchlist[anime.id]}
                      onToggle={() => toggleWatchlist(anime)}
                      onChangeStatus={(newStatus) =>
                        changeStatus(anime.id, newStatus)
                      }
                      episodesWatched={
                        watchlist[anime.id]?.episodes_watched ?? 0
                      }
                      onUpdateProgress={(newCount) =>
                        updateProgress(anime.id, newCount)
                      }
                      onClick={() => setSelectedAnime(anime.id)}
                    ></AnimeCard>
                  );
                })}
              </div>
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
        />
      )}
      {activeTab === "seasonal" && (
        <>
          <div className="flex flex-col gap-2 mb-6">
            <h1 className="text-2xl font-bold text-green-500">
              {selectedSeason.charAt(0) + selectedSeason.slice(1).toLowerCase()}{" "}
              {selectedYear}
            </h1>
            <div className="flex items-center gap-2">
              {seasonalFilter.map((season) => (
                <button
                  key={season}
                  onClick={() => {
                    setSelectedSeason(season);
                    loadSeasonalAnime(1, season, selectedYear);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    selectedSeason === season
                      ? "bg-green-500 text-black"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {season.charAt(0) + season.slice(1).toLowerCase()}
                </button>
              ))}
              <div className="w-px h-4 bg-gray-700 mx-1" />
              <select
                value={selectedYear}
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  setSelectedYear(year);
                  loadSeasonalAnime(1, selectedSeason, year);
                }}
                className="cursor-pointer bg-gray-800 text-xs rounded-full px-3 py-1 outline-none border-none font-semibold text-gray-400 hover:text-white"
              >
                {Array.from(
                  { length: new Date().getFullYear() - 2000 + 1 },
                  (_, i) => 2000 + i,
                )
                  .reverse()
                  .map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex mb-2">
            <SortSelect sortBy={sortBy} setSortBy={setSortBy} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
            {sortAnime(seasonal, sortBy).map((anime) => {
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  isLoggedIn={!!userToken}
                  inWatchlist={!!watchlist[anime.id]}
                  onToggle={() => toggleWatchlist(anime)}
                  onChangeStatus={(newStatus) =>
                    changeStatus(anime.id, newStatus)
                  }
                  episodesWatched={watchlist[anime.id]?.episodes_watched ?? 0}
                  onUpdateProgress={(newCount) =>
                    updateProgress(anime.id, newCount)
                  }
                  onClick={() => setSelectedAnime(anime.id)}
                ></AnimeCard>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4 justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (pageNum) =>
                  pageNum >= currentPage - 1 &&
                  pageNum <= currentPage + (hasNextPage ? 4 : 0),
              )
              .map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    loadSeasonalAnime(pageNum);
                  }}
                  className={`px-3 py-1 rounded text-sm ${currentPage === pageNum ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  {pageNum}
                </button>
              ))}
          </div>
        </>
      )}
      {activeTab === "top" && (
        <>
          <div className="flex mb-2">
            <SortSelect sortBy={sortBy} setSortBy={setSortBy} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
            {sortAnime(topAnime, sortBy).map((anime) => {
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  isLoggedIn={!!userToken}
                  inWatchlist={!!watchlist[anime.id]}
                  onToggle={() => toggleWatchlist(anime)}
                  onChangeStatus={(newStatus) =>
                    changeStatus(anime.id, newStatus)
                  }
                  episodesWatched={watchlist[anime.id]?.episodes_watched ?? 0}
                  onUpdateProgress={(newCount) =>
                    updateProgress(anime.id, newCount)
                  }
                  onClick={() => setSelectedAnime(anime.id)}
                ></AnimeCard>
              );
            })}
          </div>
          <div className="flex gap-2 mt-4 justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (pageNum) =>
                  pageNum >= currentPage - 1 &&
                  pageNum <= currentPage + (hasNextPage ? 4 : 0),
              )
              .map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    loadTopAnime(pageNum);
                  }}
                  className={`px-3 py-1 rounded text-sm ${currentPage === pageNum ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  {pageNum}
                </button>
              ))}
          </div>
        </>
      )}
      {modalStatus && (
        <Modal
          type={modalType}
          onClose={() => setModalStatus(false)}
          onAuthSuccess={handleAuthSuccess}
        ></Modal>
      )}
      {selectedAnime && (
        <AnimeDetail
          id={selectedAnime}
          onClose={() => setSelectedAnime(null)}
        ></AnimeDetail>
      )}
      {toastMessage && <Toast message={toastMessage}></Toast>}
    </div>
  );
}

export default App;
