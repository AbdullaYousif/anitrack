import "./index.css";
import { useState, useEffect } from "react";
import AnimeCard from "./components/AnimeCard";

function App() {
  const [searchResult, setSearchResult] = useState([]);
  const [searchQuery, setSearchQuery] = useState("Naruto");

  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchAnime = async () => {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${searchQuery}&limit=20`);
        const data = await res.json();
        setSearchResult(data.data);
      }
      fetchAnime();
    }, 500);
    return () => clearTimeout(timer); //if query changes before 500m, cancel the timer
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold text-sky-400 mb-2">AniTrack</h1>
      <p className="text-gray-400 mb-8">Never lose track of your favourite shows</p>

         <input
         className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg outline-none"
           type="text"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
         />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
        {searchResult.map(anime => {
          return (
            <AnimeCard key={anime.mal_id} anime = {anime} ></AnimeCard>
          )

        })}
       </div>


        
       
     </div>
  
    
  );
}

export default App;
