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



export async function searchAnime(search) {
let query = `query ($search: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: ANIME) {
        id
        title { romaji english }
        coverImage {large }
        averageScore
      }
    }
  }`
 const queryData = await anilistQuery(query, {search, perPage: 20})
 return queryData.Page.media.map(normalizeAnimeData)

}

export async function getSeasonalAnime() {
    const currentDate = new Date();
    const monthIndex = currentDate.getMonth();
    const currentYear = new Date()
    const seasonYear = currentYear.getFullYear();
    let season = '';
    // Get month to determine Season for API call
    if (monthIndex <=2) {
        season = 'WINTER';
    }
    else if (monthIndex<=5) {
        season = 'SPRING';
    }
    else if (monthIndex<=8) {
        season = 'SUMMER'
    }
    else {
        season = 'FALL';
    }
    let query = `query ($season: MediaSeason, $seasonYear: Int, $perPage: Int){
    Page(perPage: $perPage) {
    media(season: $season, seasonYear: $seasonYear, type: ANIME){
    id
    title {romaji english}
    coverImage {large}
    averageScore
    }
    }
    }`
    const queryData = await anilistQuery(query, {season,seasonYear, perPage: 25});
    return queryData.Page.media.map(normalizeAnimeData);

}

export async function getTopAnime() {
    let query = `query ($perPage: Int) {
    Page(perPage: $perPage) {
      media(sort: SCORE_DESC, type: ANIME) {
        id
        title { romaji english }
        coverImage { large }
        averageScore
      }
    }
  }`
  const queryData = await anilistQuery(query, {perPage: 25});
  return queryData.Page.media.map(normalizeAnimeData);
}
function normalizeAnimeData(media) {
    return {
        id: media.id,
        title: media.title.english || media.title.romaji ,
        images: {jpg: {large_image_url: media.coverImage.large}},
        score: media.averageScore ? media.averageScore /10 : null,

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