import "./index.css";
import { useState, useEffect, useRef } from "react";
import AnimeCard from "./components/AnimeCard";
import Modal from "./components/Modal";

function App() {
  const [searchResult, setSearchResult] = useState([]);
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("Naruto");
  const cacheRef = useRef({});
  const [modalStatus, setModalStatus] = useState(false);
  const [modalType, setModalType] = useState("login");
  const [userToken, setUserToken]= useState(() => {
    const saved = localStorage.getItem("userToken");
    return saved ? saved : null;
  });

  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem("watchlist");
    return saved ? JSON.parse(saved) : {};
  });

  function toggleWatchlist(anime) {
    if (watchlist[anime.mal_id]) {
      setWatchlist((current) => {
        const { [anime.mal_id]: _, ...rest } = current;
        return rest;
      });
    } else {
      setWatchlist({
        ...watchlist,
        [anime.mal_id]: { anime, status: "Plan to Watch" },
      });
    }
  }
  function handleAuthSuccess(userToken) {
    setUserToken(userToken);
    localStorage.setItem("userToken",userToken);
    setModalStatus(false);

  }
  function changeStatus(mal_id, newStatus) {
    setWatchlist({
      ...watchlist,
    [mal_id]: {...watchlist[mal_id], status: newStatus}
    });
  }
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchAnime = async () => {
        if(cacheRef.current[searchQuery]){
          setSearchResult(cacheRef.current[searchQuery]);
          return
        }
        const res = await fetch(
          `https://api.jikan.moe/v4/anime?q=${searchQuery}&limit=20`,
        );
        const data = await res.json();
        cacheRef.current[searchQuery] = data.data;
        setSearchResult(data.data);

        
      };
      fetchAnime();
    }, 500);
    return () => clearTimeout(timer); //if query changes before 500m, cancel the timer
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-sky-400 mb-2">AniTrack</h1>
      <div id="nav-bar" className="flex gap-6 mb-8">
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "watchlist"
              ? "border-sky-400 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("watchlist")}
        >
          My Watchlist
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "search"
              ? "border-sky-400 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("search")}
        >
          Search
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "register"
              ? "border-sky-400 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
           onClick={() => { setModalStatus(true), setModalType("register"); }}   
          
        >
          Sign Up
        </button>
        <button

           onClick={() => { setModalStatus(true), setModalType("login"); }}   
        >
          Login
        </button>
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {searchResult.map((anime) => {
              return (
                <AnimeCard
                  key={anime.mal_id}
                  anime={anime}
                  inWatchlist={!!watchlist[anime.mal_id]}
                  onToggle={() => toggleWatchlist(anime)}
                  onChangeStatus={(newStatus => changeStatus(anime.mal_id,newStatus))}
                ></AnimeCard>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "watchlist" && (
        <>
          <h1 className="text-2xl font-bold text-sky-400 mb-2"> My Watchlist </h1>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {Object.values(watchlist).map((item) => {
              return (
                <AnimeCard
                  key={item.anime.mal_id}
                  inWatchlist={true}
                  onToggle={()=> toggleWatchlist(item.anime)}
                  status={item.status}
                  anime={item.anime}
                  onChangeStatus={(newStatus => changeStatus(item.anime.mal_id,newStatus))}
                ></AnimeCard>
              );
            })}
          </div>
        </>
      )}
      {modalStatus && <Modal type={modalType} onClose={()=> setModalStatus(false)} onAuthSuccess={handleAuthSuccess}></Modal>}
    </div>
  );
}

export default App;
