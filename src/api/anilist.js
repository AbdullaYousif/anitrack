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
      media(search: $search, type: ANIME) {
        id
        title { romaji english }
        coverImage {large }
        averageScore
      }
    }
  }`
 const queryData = await anilistQuery(query, {search, page, perPage: 20})
 return {media: queryData.Page.media.map(normalizeAnimeData), pageInfo: queryData.Page.pageInfo}

}

export async function getSeasonalAnime(page) {
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
    let query = `query ($season: MediaSeason, $seasonYear: Int, $page: Int $perPage: Int){
    Page(page: $page, perPage: $perPage) {
    media(season: $season, seasonYear: $seasonYear, type: ANIME){
    id
    title {romaji english}
    coverImage {large}
    averageScore
    }
    pageInfo {
    total
    lastPage
    hasNextPage
    }
    }
    }`
    const queryData = await anilistQuery(query, {season,seasonYear,page, perPage: 20});
 return {media: queryData.Page.media.map(normalizeAnimeData), pageInfo: queryData.Page.pageInfo}

}

export async function getTopAnime(page) {
    let query = `query ($perPage: Int, $page: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: SCORE_DESC, type: ANIME) {
        id
        title { romaji english }
        coverImage { large }
        averageScore
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