import React from "react";

function AnimeCard({anime}) {
    
    return (
       <div className="bg-gray-900 text-white flex flex-col rounded-xl overflow-hidden ">
              <img className="w-full aspect-2/3 object-cover" src={anime.images.jpg.large_image_url} alt={anime.title} />
              <div className="p-3">
                <p className="text-lg font-semibold line-clamp-2">{anime.title}</p>
                <p className="text-base text-gray-500">{anime.score ?? 'N/A'}</p>
              </div>
              
              </div>
    )
            
}
export default AnimeCard;