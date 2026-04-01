import "./index.css";
import { useState, useEffect, useRef } from "react";
import { getSeasonalAnime, getTopAnime, searchAnime } from "./api/anilist";
import AnimeCard from "./components/AnimeCard";
import AnimeDetail from "./components/AnimeDetail";
import Modal from "./components/Modal";

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
  const [userID, setUserID] = useState( () => {
    const saved = localStorage.getItem("userID");
    return saved ? saved : null;
  })
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
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json",
        }, 
      })

    } else {
      setWatchlist({
        ...watchlist,
        [anime.id]: { anime, status: "Plan to Watch" },
      });
      await fetch(`http://localhost:3000/watchlist/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json",
        }, 
        body: JSON.stringify({user_id: userID, anime_id: anime.id, anime_data: anime, status: "Plan to Watch" })
      })
    }
  }
  function handleAuthSuccess(userToken, username,user_id) {
    setUserToken(userToken);
    localStorage.setItem("userToken", userToken);
    setModalStatus(false);
    setUsername(username);
    localStorage.setItem("username", username);
    setUserID(user_id);
    localStorage.setItem("userID",user_id);
  }
 async function changeStatus(anime_id, newStatus) {
    setWatchlist({
      ...watchlist,
      [anime_id]: { ...watchlist[anime_id], status: newStatus },
    });
    await fetch(`http://localhost:3000/watchlist/${anime_id}`, {
      method: "PATCH",
      headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({status: newStatus})
    })
  }
  useEffect(() => {
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect( () => {
    const fetchWatchlist = async () => {
      if(userToken){
        const res = await fetch(`http://localhost:3000/watchlist/${userID}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${userToken}`,
          }
        })
        const data = await res.json();
        const result = {};
        data.forEach(row => {
          result[row.anime_id] = {anime: row.anime_data, status: row.status};
        })
        setWatchlist(result);
      }
    }
    fetchWatchlist();

  }, [userID,userToken]);
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchAnime = async () => {
        if (cacheRef.current[searchQuery]) {
          setSearchResult(cacheRef.current[searchQuery]);
          return;
        }
        const data = await searchAnime(searchQuery);
        cacheRef.current[searchQuery] = data;
        setSearchResult(data);
      };
      fetchAnime();
    }, 500);
    return () => clearTimeout(timer); //if query changes before 500m, cancel the timer
  }, [searchQuery]);


async function loadSeasonalAnime() {
    if (cacheRef.current["seasonal"]) {
    setSeasonal(cacheRef.current["seasonal"]);
    return
  }
  const data = await getSeasonalAnime();
  cacheRef.current["seasonal"] = data;
  setSeasonal(data);
}

  async function loadTopAnime() {
     if (cacheRef.current["top"]) {
    setTopAnime(cacheRef.current["top"]);
    return
  }
  const data = await getTopAnime();
  cacheRef.current["top"] = data;
  setTopAnime(data);
}
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-green-500 mb-2">AniTrack</h1>
      <div id="nav-bar" className="flex gap-6 mb-8">
        {userToken && (<button
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "watchlist"
              ? "border-green-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("watchlist")}
        >
          My Watchlist
        </button>)}
        <button
          className={`cursor-pointer px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "search"
              ? "border-green-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("search")}
        >
          Search
        </button>

        <button
          className={` cursor-pointer px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "seasonal"
              ? "border-green-500 text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
            onClick={() => { setActiveTab("seasonal"); loadSeasonalAnime(); }}
        >
          Seasonal Anime
        </button>

          <button
          className={` cursor-pointer px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 ${
            activeTab === "top"
              ? "border-green-500 text-white cursor-pointer"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
          onClick={() => { setActiveTab("top"); loadTopAnime(); }}
        >
          Top Anime
        </button>
        <div className="ml-auto flex gap-4 items-center">
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
              <span className="cursor-pointer text-gray-400 text-sm"> <span className="text-white font-semibold">{username}</span></span>
              <button
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white"
                onClick={() => { setUserToken(null); setUsername(null); localStorage.removeItem("userToken"); }}
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {searchResult.map((anime) => {
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
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
        </>
      )}
      {activeTab === "watchlist" && (
        <>
          <h1 className="text-2xl font-bold text-green-500 mb-2">
            {" "}
            My Watchlist{" "}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {Object.values(watchlist).map((item) => {
              return (
                <AnimeCard
                  key={item.anime.id}
                  inWatchlist={true}
                  onToggle={() => toggleWatchlist(item.anime)}
                  status={item.status}
                  anime={item.anime}
                  onChangeStatus={(newStatus) =>
                    changeStatus(item.anime.id, newStatus)
                  }
                  onClick={() => setSelectedAnime(item.anime.id)}
                ></AnimeCard>
              );
            })}
          </div>
        </>
      )}
      {activeTab === "seasonal" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {seasonal.map((anime) => {
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
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
        </>
      )}
      {activeTab === "top" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            {topAnime.map((anime) => {
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
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
    </div>
  );
}

export default App;
