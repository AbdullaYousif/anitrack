import "./index.css";
import { useState, useEffect, useRef, use } from "react";
import { flushSync } from "react-dom";
import Select from "react-select";
import luffyImg from "../public/one-piece-luffy-thumbs-up.png";
import { getSeasonalAnime, getTopAnime, searchAnime } from "./api/anilist";
import AnimeCard from "./components/AnimeCard";
import SkeletonCard from "./components/SkeletonCard";
import AnimeDetail from "./components/AnimeDetail";
import Modal from "./components/Modal";
import Toast from "./components/Toast";
import Watchlist from "./components/Watchlist";

function App() {
  const [searchResult, setSearchResult] = useState([]);
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
  const [toastMessage, setToastMessage] = useState(null);
  const [watchListFilter, setWatchlistFilter] = useState("All");
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
          result[row.anime_id] = { anime: row.anime_data, status: row.status };
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

  async function loadSeasonalAnime(page = 1) {
    const cacheKey = `seasonal-${page}`;
    if (cacheRef.current[cacheKey]) {
      const cached = cacheRef.current[cacheKey];
      setSeasonal(cached.media);
      setTotalPages(cached.pageInfo.lastPage);
      setHasNextPage(cached.pageInfo.hasNextPage);
      return;
    }
    const data = await getSeasonalAnime(page);
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
              {searchResult.map((anime) => {
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
                    onClick={() => setSelectedAnime(anime.id)}
                  ></AnimeCard>
                );
              })}
            </div>
          )}
        </>
      )}
      {activeTab === "watchlist" && (
        <Watchlist
          watchlist={watchlist}
          onToggle={toggleWatchlist}
          onChangeStatus={changeStatus}
          onSelectAnime={setSelectedAnime}
          isLoggedIn={!!userToken}
        />
      )}
      {activeTab === "seasonal" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
            {seasonal.map((anime) => {
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-4">
            {topAnime.map((anime) => {
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
