# Movix Bug Tracker (`replica/bugs.md`)

Recorded and resolved during `/replica-test` QA execution.

---

### BUG-001: 404 Broken Image URLs Showing Fallback Posters (Animal, Squid Game, Red Notice, Extraction 2, Rebel Ridge, Do Patti, Drishyam 2)
- **Severity**: S2 (feature visually broken; showed generic placeholder artwork instead of movie posters)
- **Steps to Reproduce**:
  1. Launch app and scroll down through "Top 10 Today", "New Releases", and "Netflix Trending".
  2. Observe posters for Animal, Squid Game, Red Notice, Extraction 2, Rebel Ridge, and Drishyam 2.
- **Expected**: High-resolution official movie posters and backdrops load with HTTP 200 OK.
- **Actual**: 11 image URLs returned HTTP 404, triggering `onError` to fall back to generic placeholder artwork.
- **Root Cause**: Stale/typo TMDb hash links in `src/data/movies.ts` and wrong TMDB ID (917496 instead of 646097) for Rebel Ridge.
- **Fix**: 
  - Updated all 11 image URLs in `src/data/movies.ts` to verified 200 OK TMDB links.
  - Downloaded high-resolution assets locally into `public/assets/` (`poster_rebel_ridge.jpg`, `backdrop_rebel_ridge.jpg`, `poster_squid_game.jpg`, `backdrop_squid_game.jpg`, `poster_drishyam_2.jpg`, etc.) for zero-latency, 100% offline fail-safe reliability.
- **Status**: Verified Fixed (Test `F01-E1.5` passed with 0 failures).

---

### BUG-002: Sci-Fi Universe Carousel Containing Non-Sci-Fi Crime & Action Movies
- **Severity**: S3 (curation mismatch)
- **Steps to Reproduce**:
  1. Scroll down to "Sci-Fi Universe" carousel or select "Sci-Fi Universe" filter chip.
  2. Observe titles: Red Notice, Extraction 2, Rebel Ridge, The Gray Man.
- **Expected**: Only true sci-fi movies (Kalki, Dune, Interstellar, Inception, Stranger Things, Alien Romulus).
- **Actual**: Crime/heist/action movies were listed under Sci-Fi.
- **Root Cause**: Index slicing in `sciFiPicks` array referenced incorrect positions from `netflixTop10`.
- **Fix**: Replaced array entries with actual Sci-Fi cinema titles (`featuredIndianMovie` [Kalki], `DUNE: PART TWO`, `INTERSTELLAR`, `INCEPTION`, `STRANGER THINGS`, `ALIEN: ROMULUS`, `DEADPOOL & WOLVERINE`).
- **Status**: Verified Fixed (Tests `F03-H1.1`, `F03-H1.2` passed).

---

### BUG-003: External Ads Launching Google Chrome Browser
- **Severity**: S1 (app immersion broken; kicked user out of app into Chrome)
- **Steps to Reproduce**:
  1. Play movie stream in `VideoPlayerModal`.
  2. Rogue redirect inside third-party streaming iframe attempts to navigate to advertiser URL.
- **Expected**: App remains strictly contained in Movix; external browser never opens.
- **Actual**: Android default browser (Google Chrome) was invoked.
- **Root Cause**: Default WebView handling permitted intent URLs to escape the container.
- **Fix**: Overrode `BridgeWebViewClient.shouldOverrideUrlLoading` in `MainActivity.java` to strictly allow `https://localhost` and return `true` to swallow/block all external ad navigations.
- **Status**: Verified Fixed (Test `F05-H4.3` passed).

---

### BUG-004: Video Player Overlay Controls Visible During Playback
- **Severity**: S2 (cinema view obstructed)
- **Steps to Reproduce**:
  1. Tap "Play" on any movie.
  2. Video plays, but floating pill buttons remained permanently visible over video content.
- **Expected**: Cinema view should be 100% clean and unobstructed with all buttons auto-hiding.
- **Actual**: Buttons persisted on screen.
- **Fix**:
  - Removed persistent bottom action bar from player.
  - Controls fade completely (`opacity-0 pointer-events-none`) after 3.5 seconds.
  - Added invisible top-edge click zone (`h-24 z-30`) so users can tap to reveal top control bar when needed.
  - Added transparent click-shield backdrop (`z-40`) to close dropdown drawers without touch bleeding into the underlying video iframe.
- **Status**: Verified Fixed (Tests `F05-H1.5`, `F05-H2.1`, `F05-H3.1` passed).

---

### BUG-005: Carousel Scroll Jitter and Frame Drops
- **Severity**: S3 (performance & smoothness)
- **Steps to Reproduce**:
  1. Swipe rapidly across movie carousels.
  2. Notice micro-stutters and frame drops during horizontal swipe.
- **Root Cause**: Aggressive CSS `snap-x` conflicting with touch gestures, lack of GPU compositor layers, and synchronous image decoding.
- **Fix**:
  - Removed `snap-x snap-mandatory` from `MovieCarousel.tsx`.
  - Added `-webkit-overflow-scrolling: touch`, `decoding="async"`, and `transform: translateZ(0)`.
  - Wrapped `MovieCarousel`, `Hero`, and `OttProviderBar` in `React.memo`.
- **Status**: Verified Fixed.
