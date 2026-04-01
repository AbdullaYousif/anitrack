import { useState, useEffect } from "react";
import { getAnimeDetails } from "../api/anilist";

function AnimeDetail({id, onClose}) {
    const [animeDetail, setAnimeDetail] = useState(null);

    useEffect(() => {
        const fetchAnimeDetails = async () => {
            const result = await getAnimeDetails(id);
            setAnimeDetail(result);
        }
        fetchAnimeDetails();
    }, [])

    if(!animeDetail) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-green-500 rounded-full text-sm font-bold transition-colors hover: cursor-pointer"
                >
                    ✕
                </button>
                <div className="flex gap-6 p-6">
                    <img
                        className="w-44 shrink-0 rounded-lg object-cover self-start"
                        src={animeDetail.coverImage.large}
                        alt={animeDetail.title.english || animeDetail.title.romaji}
                    />
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-white leading-tight">
                            {animeDetail.title.english || animeDetail.title.romaji}
                        </h2>
                        <div className="flex gap-4 text-sm text-gray-400">
                            <span className="text-green-400 font-semibold">⭐ {animeDetail.averageScore ? (animeDetail.averageScore / 10).toFixed(1) : "N/A"}</span>
                            <span>{animeDetail.status}</span>
                            <span>{animeDetail.episodes ? `${animeDetail.episodes} eps` : "? eps"}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {animeDetail.genres.map(genre => (
                                <span key={genre} className="px-2 py-1 bg-gray-800 text-green-300 text-xs rounded-full">{genre}</span>
                            ))}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: animeDetail.description }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AnimeDetail;
