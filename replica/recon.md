# Movix Application Reconnaissance Map

## App Overview
- **App Name**: MOVIX (PvrPlay Engine)
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Capacitor 8 (Android)
- **Target OS**: Android (com.movix.app) & Web (Vercel)
- **Theme**: Dark Cinema Netflix Palette (`#080A0F`, `#E50914`, `#FFFFFF`)

---

## Core User Flows

### Flow F01: App Launch & Initial Feed Hydration
- User opens app.
- Loading screen displays Movix 3D branding while initial catalog & local caches hydrate.
- Feed mounts smoothly with:
  - Top Header (Logo, VIP badge, Search shortcut, Profile)
  - Hero Billboard featuring featured Indian movie (*Kalki 2898 AD*) with direct Play and My List buttons
  - OTT Provider Bar ("Cinema Hubs") for filtering
  - Continue Watching carousel
  - Dynamic Carousels: Top 10 in India, New Releases, Indian Blockbusters, Hollywood 4K, Romance, Thrillers, Sci-Fi Universe
  - Bottom Navigation Bar (Home, Search, Downloads, My List)

### Flow F02: Hero Interaction & 1-Tap Playback
- User views Hero banner.
- User taps "Play" -> instantly launches full-screen `VideoPlayerModal` with active streaming sources.
- User taps "+ My List" -> adds/removes movie from saved watchlist with feedback toast.

### Flow F03: OTT Cinema Hubs Filtering
- User taps filter pills in `OttProviderBar`:
  - "Indian Cinema", "New Releases", "Hollywood 4K", "Action & Thrill", "Mystery & Crime", "Romance & Drama", "Sci-Fi Universe".
- Feed smoothly switches to filtered grid with category header and "Show All" toggle.
- 60 FPS hardware accelerated horizontal scrolling with zero jank.

### Flow F04: Movie Selection & Details Modal
- User taps any movie card across any carousel.
- `MovieDetailsModal` opens with:
  - High-resolution horizontal backdrop and vertical poster
  - Synopsis, release year, runtime, rating badge, audio language tags
  - Cast list with portraits
  - Action buttons: "Play Now" (Instant Cinema), "Resolution & Audio", "Download", "Watchlist"
  - Similar titles row

### Flow F05: Cinema Video Player (XPlayer Engine)
- Full-screen cinema player overlay (`VideoPlayerModal`).
- Responsive edge-to-edge video canvas supporting both VidLink/Embed streaming and direct MP4 fallback.
- Auto-hide controls: All buttons, icons, and overlays completely disappear while movie is playing.
- Top-edge tap zone smoothly reveals top control bar (Resolution selector, Audio language, Rotation, Speed, Server mirror, Close).
- Full-screen click-shield backdrop prevents touch-bleed into underlying video iframe when opening dropdown drawers.
- Native Android WebViewClient blocks rogue ad popups from opening Google Chrome.
- Orientation auto-lock and manual 1-tap rotate toggle.
- XPlayer gesture controls for volume, brightness, and seek scrub.

### Flow F06: Search & Instant Discovery
- User switches to Search tab via BottomNav or Top Header.
- Real-time search across 36 curated movies by title, actors, directors, and genres.
- Quick filter chips (Trending, Top Rated, Action, Horror, etc.).
- Clean empty state with search suggestions when no match is found.

### Flow F07: My List / Watchlist
- User navigates to My List tab.
- Displays all saved titles stored in `localStorage`.
- Allows instant playback or removal from list.
- Empty state with "Browse Movies" button navigating back to Home feed.

### Flow F08: Offline Downloads Simulation
- User navigates to Downloads tab.
- Displays downloaded titles with file size and status.
- Allows direct playback from downloaded items.

### Flow F09: Navigation & Multi-Tab State
- Bottom navigation with active pill indicators and smooth transitions between Home, Search, Downloads, and My List.
