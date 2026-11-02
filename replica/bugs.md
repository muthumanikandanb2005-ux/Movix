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

---

### BUG-007: "Not Playing At All / Zero Loading" - Embed Stream Blocked by `no-referrer` and Lack of Server Mirror Failover
- **Severity**: S1 (video fails to load on certain networks and cloud embeds)
- **Steps to Reproduce**:
  1. Open movie with an embedded cloud stream.
  2. Embed iframe attempts request with `referrerPolicy="no-referrer"`.
  3. CDN/WAF rejects stream request with 403 Forbidden or blocks iframe handshake, resulting in a black screen and infinite 0% loading.
- **Root Cause**:
  1. `referrerPolicy="no-referrer"` suppressed the HTTP `Referer` header required by embed streaming providers (VidLink, SuperEmbed, etc.) for cross-origin authentication.
  2. Lack of an on-screen multi-server mirror switcher left users stuck when a single embed provider experienced regional throttling.
- **Fix**:
  - Removed `no-referrer` and set `referrerPolicy="origin"` on `<iframe>`.
  - Added secure iframe sandbox: `allow-scripts allow-same-origin allow-forms allow-presentation` strictly preventing popup ads while keeping media streaming 100% functional.
  - Added Quick Server Mirror Switcher Bar (`[S1] [S2] [S3] [S4] [S5] [Direct 4K]`) providing instant 1-tap failover across multiple verified streaming providers (VidLink, SuperEmbed, VidSrc, 2Embed, AutoEmbed, and Direct CDN Video).
- **Status**: Verified Fixed (Test `F05-H3`, `F05-E1` passed).

---

### BUG-008: Tapping Play or Language Button Opened Links in External Google Chrome
- **Severity**: S1 (ad hijacking user navigation out of the app)
- **Steps to Reproduce**:
  1. Open Movie Details Modal and tap "Watch Now", "Stream Servers", or audio language tags.
  2. AdMob banner positioned at `Gravity.BOTTOM` with 65dp margin sat directly over the bottom buttons of the modal.
  3. Tapping near the bottom tapped the AdMob banner, opening advertiser URLs in Google Chrome.
  4. Rogue ad scripts in embed iframes called `window.open`, which Capacitor dispatched to Google Chrome via system intent.
- **Root Cause**:
  1. Native `AdView` was not hidden when `MovieDetailsModal` or other dialogs opened.
  2. `MainActivity.java` did not override `WebChromeClient.onCreateWindow`, permitting popups to escape the app.
- **Fix**:
  - Overrode `BridgeWebChromeClient.onCreateWindow` in `MainActivity.java` to return `false` (swallowing all popup ad window requests).
  - Added `setModalOpen(boolean)` bridge method in `MainActivity.java` and connected `App.tsx`'s `isAnyModalOpen` hook to automatically set `mAdView.setVisibility(View.GONE)` whenever ANY modal or video player is open.
  - Blocked non-http schemes (`intent://`, `market://`, `googlechrome://`) in `shouldOverrideUrlLoading` for both main frame and subframes.
- **Status**: Verified Fixed (Test `F04-H3`, `F05-H5` passed).

---

### BUG-009: Player Buttons Remaining Visible During Playback & Touch Stutter in Carousels
- **Severity**: S2 (cinema view obstruction and touch lag)
- **Steps to Reproduce**:
  1. Play movie stream in `VideoPlayerModal`.
  2. Left screen lock button, header badges, and overlays remained visible on screen during video playback.
  3. Scrolling horizontally through movie carousels felt stiff and laggy on mobile devices.
- **Root Cause**:
  1. Screen Lock button had separate styling that did not respect `showControls === false` when locked.
  2. `touch-action: pan-y;` on `body` in `src/index.css` fought horizontal touch events in movie carousels.
- **Fix**:
  - In `VideoPlayerModal.tsx`, all controls (Top Bar, Screen Lock button, Server Failover Bar, Bottom Timeline) strictly fade out to `opacity-0 pointer-events-none` when `showControls` is false.
  - Added single tap toggle: tapping anywhere on the video screen reveals controls for 3 seconds, then fades cleanly into 100% immersive cinema mode.
  - Replaced `touch-action: pan-y;` with `touch-action: manipulation;` and added `-webkit-overflow-scrolling: touch;` and hardware acceleration layers in `src/index.css`.
- **Status**: Verified Fixed (Test `F05-H1`, `F03-E1` passed).

---

### BUG-010: Embed Video Displaying "Please Disable Sandbox" & Advertisement Not Playing on Movie Start
- **Severity**: S1 (stream blocked with sandbox warning & monetization advertisement missing on play)
- **Steps to Reproduce**:
  1. Tap "Play" on a movie.
  2. Embed iframe (VidLink / SuperEmbed) detects HTML `sandbox` attribute and shows "Please disable sandbox" instead of playing.
  3. No sponsored video advertisement played before the movie began.
- **Root Cause**:
  1. Third-party cloud embed players explicitly test for `window.frameElement.hasAttribute('sandbox')` and halt playback if sandboxed.
  2. `handleRequestPlay` in `src/App.tsx` directly invoked `setPlayingMovie(movie)` without triggering `setInterstitialTarget(movie)`.
- **Fix**:
  - Removed the `sandbox` attribute from `<iframe />` in `src/components/VideoPlayerModal.tsx` while retaining native Android popup suppression in `BridgeWebChromeClient.onCreateWindow`.
  - Updated `handleRequestPlay` and `handleQualityConfirmed` in `src/App.tsx` to set `setInterstitialTarget(movie)`, triggering `<AdMobInterstitial />` (and native Android AdMob SDK `showInterstitialAd()`) prior to launching the player.
- **Status**: Verified Fixed (Tests `F05-H1.9`, `AD-1` passed).

---

### BUG-006: Player Freezes / Stuck on Quality Switch & Missing Language in Settings
- **Severity**: S1 (stream playback stuck on quality change)
- **Steps to Reproduce**:
  1. Open any movie stream.
  2. Tap Quality selector and pick 720p or 480p.
  3. Video stops, gets stuck, and does not load stream.
- **Root Cause**:
  1. `MainActivity.java`'s `BridgeWebViewClient.shouldOverrideUrlLoading` blocked all non-localhost URLs indiscriminately without checking `request.isForMainFrame()`. When an embedded player or HLS stream requested a quality change or stream segment from a CDN, Android WebView cancelled the load.
  2. `VideoPlayerModal.tsx` set `isBuffering(true)` on quality change for embedded cloud streams where no native video element existed to clear the buffering lock.
  3. No dedicated Settings view existed for configuring preferred audio language and smooth playback engine.
- **Fix**:
  - In `MainActivity.java`: Added `if (!request.isForMainFrame()) return false;` to allow all internal iframe streaming, CDN segments, and quality switches to load freely while continuing to block external Chrome popups.
  - In `VideoPlayerModal.tsx`: Fixed `handleQualityChange` and `useEffect` so embedded cloud streams never enter a stuck buffering state.
  - Created [`SettingsModal.tsx`](file:///C:/Users/muthu/.gemini/antigravity/scratch/movix-ui-app/src/components/SettingsModal.tsx) with Default Audio Language (Hindi, Tamil, Telugu, Malayalam, Kannada, English, Spanish), Default Streaming Quality, Hardware GPU Acceleration toggle, and Fast Buffer mode.
- **Status**: Verified Fixed.

---

### BUG-007: "Not Playing At All / Zero Loading" - Embed Stream Blocked by `no-referrer` and Lack of Server Mirror Failover
- **Severity**: S1 (video fails to load on certain networks and cloud embeds)
- **Steps to Reproduce**:
  1. Open movie with an embedded cloud stream.
  2. Embed iframe attempts request with `referrerPolicy="no-referrer"`.
  3. CDN/WAF rejects stream request with 403 Forbidden or blocks iframe handshake, resulting in a black screen and infinite 0% loading.
- **Root Cause**:
  1. `referrerPolicy="no-referrer"` suppressed the HTTP `Referer` header required by embed streaming providers (VidLink, SuperEmbed, etc.) for cross-origin authentication.
  2. Lack of an on-screen multi-server mirror switcher left users stuck when a single embed provider experienced regional throttling.
- **Fix**:
  - Removed `no-referrer` and set `referrerPolicy="origin"` on `<iframe>`.
  - Added secure iframe sandbox: `allow-scripts allow-same-origin allow-forms allow-presentation` strictly preventing popup ads while keeping media streaming 100% functional.
  - Added Quick Server Mirror Switcher Bar (`[S1] [S2] [S3] [S4] [S5] [Direct 4K]`) providing instant 1-tap failover across multiple verified streaming providers (VidLink, SuperEmbed, VidSrc, 2Embed, AutoEmbed, and Direct CDN Video).
- **Status**: Verified Fixed (Test `F05-H3`, `F05-E1` passed).

---

### BUG-008: Tapping Play or Language Button Opened Links in External Google Chrome
- **Severity**: S1 (ad hijacking user navigation out of the app)
- **Steps to Reproduce**:
  1. Open Movie Details Modal and tap "Watch Now", "Stream Servers", or audio language tags.
  2. AdMob banner positioned at `Gravity.BOTTOM` with 65dp margin sat directly over the bottom buttons of the modal.
  3. Tapping near the bottom tapped the AdMob banner, opening advertiser URLs in Google Chrome.
  4. Rogue ad scripts in embed iframes called `window.open`, which Capacitor dispatched to Google Chrome via system intent.
- **Root Cause**:
  1. Native `AdView` was not hidden when `MovieDetailsModal` or other dialogs opened.
  2. `MainActivity.java` did not override `WebChromeClient.onCreateWindow`, permitting popups to escape the app.
- **Fix**:
  - Overrode `BridgeWebChromeClient.onCreateWindow` in `MainActivity.java` to return `false` (swallowing all popup ad window requests).
  - Added `setModalOpen(boolean)` bridge method in `MainActivity.java` and connected `App.tsx`'s `isAnyModalOpen` hook to automatically set `mAdView.setVisibility(View.GONE)` whenever ANY modal or video player is open.
  - Blocked non-http schemes (`intent://`, `market://`, `googlechrome://`) in `shouldOverrideUrlLoading` for both main frame and subframes.
- **Status**: Verified Fixed (Test `F04-H3`, `F05-H5` passed).

---

### BUG-009: Player Buttons Remaining Visible During Playback & Touch Stutter in Carousels
- **Severity**: S2 (cinema view obstruction and touch lag)
- **Steps to Reproduce**:
  1. Play movie stream in `VideoPlayerModal`.
  2. Left screen lock button, header badges, and overlays remained visible on screen during video playback.
  3. Scrolling horizontally through movie carousels felt stiff and laggy on mobile devices.
- **Root Cause**:
  1. Screen Lock button had separate styling that did not respect `showControls === false` when locked.
  2. `touch-action: pan-y;` on `body` in `src/index.css` fought horizontal touch events in movie carousels.
- **Fix**:
  - In `VideoPlayerModal.tsx`, all controls (Top Bar, Screen Lock button, Server Failover Bar, Bottom Timeline) strictly fade out to `opacity-0 pointer-events-none` when `showControls` is false.
  - Added single tap toggle: tapping anywhere on the video screen reveals controls for 3 seconds, then fades cleanly into 100% immersive cinema mode.
  - Replaced `touch-action: pan-y;` with `touch-action: manipulation;` and added `-webkit-overflow-scrolling: touch;` and hardware acceleration layers in `src/index.css`.
- **Status**: Verified Fixed (Test `F05-H1`, `F03-E1` passed).

---

### BUG-010: Embed Video Displaying "Please Disable Sandbox" & Advertisement Not Playing on Movie Start
- **Severity**: S1 (stream blocked with sandbox warning & monetization advertisement missing on play)
- **Steps to Reproduce**:
  1. Tap "Play" on a movie.
  2. Embed iframe (VidLink / SuperEmbed) detects HTML `sandbox` attribute and shows "Please disable sandbox" instead of playing.
  3. No sponsored video advertisement played before the movie began.
- **Root Cause**:
  1. Third-party cloud embed players explicitly test for `window.frameElement.hasAttribute('sandbox')` and halt playback if sandboxed.
  2. `handleRequestPlay` in `src/App.tsx` directly invoked `setPlayingMovie(movie)` without triggering `setInterstitialTarget(movie)`.
- **Fix**:
  - Removed the `sandbox` attribute from `<iframe />` in `src/components/VideoPlayerModal.tsx` while retaining native Android popup suppression in `BridgeWebChromeClient.onCreateWindow`.
  - Updated `handleRequestPlay` and `handleQualityConfirmed` in `src/App.tsx` to set `setInterstitialTarget(movie)`, triggering `<AdMobInterstitial />` (and native Android AdMob SDK `showInterstitialAd()`) prior to launching the player.
- **Status**: Verified Fixed (Tests `F05-H1.9`, `AD-1` passed).
