async function anilistQuery(query, variables){

    let url = "https://graphql.anilist.co",
    options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            query: query,
            variables: variables
        })
    };
 const response = await fetch(url,options);
 if (!response.ok) {
    throw new Error("Invalid Query");
 }
 const data = await response.json();
 return data.data;
}



export async function searchAnime(search,page) {
let query = `query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
    pageInfo {
    total
    lastPage
    hasNextPage
    }
      media(search: $search, type: ANIME, isAdult: false, genre_not_in: ["Hentai", "Ecchi"]) {
        id
        title { romaji english }
        coverImage {large }
        averageScore
        episodes
      }
    }
  }`
 const queryData = await anilistQuery(query, {search, page, perPage: 20})
 return {media: queryData.Page.media.map(normalizeAnimeData), pageInfo: queryData.Page.pageInfo}

}

export function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month <= 2) return 'WINTER';
    if (month <= 5) return 'SPRING';
    if (month <= 8) return 'SUMMER';
    return 'FALL';
}

export async function getSeasonalAnime(page, season, year) {
    let query = `query ($season: MediaSeason, $seasonYear: Int, $page: Int $perPage: Int){
    Page(page: $page, perPage: $perPage) {
    media(season: $season, seasonYear: $seasonYear, type: ANIME, isAdult: false, genre_not_in: ["Hentai", "Ecchi"]){
    id
    title {romaji english}
    coverImage {large}
    averageScore
    episodes
    }
    pageInfo {
    total
    lastPage
    hasNextPage
    }
    }
    }`
    const queryData = await anilistQuery(query, {season, seasonYear: year, page, perPage: 20});
    return {media: queryData.Page.media.map(normalizeAnimeData), pageInfo: queryData.Page.pageInfo}
}

export async function getTopAnime(page) {
    let query = `query ($perPage: Int, $page: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: SCORE_DESC, type: ANIME, isAdult: false, genre_not_in: ["Hentai", "Ecchi"]) {
        id
        title { romaji english }
        coverImage { large }
        averageScore
        episodes
      }
    pageInfo {
    total
    lastPage
    hasNextPage
    }
    }
    
  }`
  const queryData = await anilistQuery(query, {page, perPage: 20});
 return {media: queryData.Page.media.map(normalizeAnimeData), pageInfo: queryData.Page.pageInfo}
}
function normalizeAnimeData(media) {
    return {
        id: media.id,
        title: media.title.english || media.title.romaji ,
        images: {jpg: {large_image_url: media.coverImage.large}},
        score: media.averageScore ? media.averageScore /10 : null,
        episodes: media.episodes ?? null,
    }
}

export async function getAnimeDetails(id) {
    let query = `
    query($id: Int){
    Media(id: $id, type: ANIME){
    id
    title {romaji english}
    description
    status
    genres
    coverImage {
    large
    }
    averageScore
    episodes
    
    }
}`
const queryData = await anilistQuery(query, {id})
return queryData.Media;
}