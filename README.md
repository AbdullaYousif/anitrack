# AniTrack

A full-stack anime tracking app. Search for anime, manage a personal watchlist, track episode progress, and browse seasonal and top-rated shows.

**Live demo:** [URL](https://anitrack-alpha.vercel.app/)

---

## Features

- **Search** — debounced search with per-query caching
- **Watchlist** — add/remove anime, filter by status (Watching, Completed, Plan to Watch)
- **Episode tracking** — log progress with +/− buttons or direct input, capped at total episodes
- **Seasonal browser** — browse any season from 2000 to present
- **Top anime** — ranked by score via Anilist
- **Infinite scroll** — loads more as you scroll
- **Sort** — sort any tab by score or title
- **Auth** — JWT authentication with bcrypt password hashing

## Tech Stack

**Frontend** — React, Vite, Tailwind CSS

**Backend** — Node.js, Express, PostgreSQL

**API** — [Anilist GraphQL API](https://anilist.gitbook.io/anilist-apiv2-docs/)
