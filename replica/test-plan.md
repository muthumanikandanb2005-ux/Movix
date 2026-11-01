# Movix Replica Test Plan

Generated per `/replica-test` methodology for the Movix application.

---

## Flow F01: App Launch & Initial Feed Hydration
- **F01-H1 (Happy Path)**: User opens app. Loading screen appears with Movix 3D logo, then fades into Home screen showing Hero banner, OTT Provider Bar, Continue Watching, and movie carousels.
- **F01-E1 (Edge Case - Offline / TMDB Network Failure)**: User launches app without internet or behind TMDB-blocking ISP. App falls back gracefully to static curated catalog with 100% verified 200 OK local/CDN images. No white screen or crashing.
- **F01-E2 (Edge Case - Mobile Viewport Constraints)**: Viewport width 360px to 420px (standard Android phones). Layout fits without horizontal page overflow or broken flex layouts.
- **F01-N1 (Negative Case - Corrupt LocalStorage State)**: LocalStorage contains malformed JSON for `myList` or `continueWatching`. App catches error, uses safe defaults, and hydrates without crashing.

---

## Flow F02: Hero Interaction & 1-Tap Playback
- **F02-H1 (Happy Path)**: User taps "Play" on Hero movie (*Kalki 2898 AD*). Cinema video player launches full screen immediately.
- **F02-H2 (Happy Path - Watchlist Toggle)**: User taps "+ My List" on Hero. Button switches to "✓ In List", toast confirms addition, and movie appears in My List tab.
- **F02-E1 (Edge Case - Rapid Repeated Clicks)**: User double-clicks "Play" or "+ My List". No duplicate player modals or double toast stacking.

---

## Flow F03: OTT Cinema Hubs Filtering
- **F03-H1 (Happy Path)**: User taps "Indian Cinema", "Hollywood 4K", or "Sci-Fi Universe" pill. Feed filters to show matching titles with category title header. Tapping "Show All" restores full carousel feed.
- **F03-E1 (Edge Case - Horizontal Scrolling Smoothness)**: User rapidly scrolls OTT pill bar and movie carousels horizontally. Smooth 60 FPS scrolling without micro-stutter, jank, or scroll snapping locking.
- **F03-E2 (Edge Case - Filter Empty State)**: User filters by category where no movies match. Displays helpful empty state with clear reset button.

---

## Flow F04: Movie Selection & Details Modal
- **F04-H1 (Happy Path)**: User taps any movie card. Details modal opens smoothly showing movie backdrop, poster, title, duration, rating, genres, audio languages, synopsis, and cast.
- **F04-H2 (Happy Path - Play from Details)**: User taps "Play Now" inside details modal. Modal transitions smoothly into full-screen video player.
- **F04-E1 (Edge Case - Image Fallback)**: If an external image CDN fails to respond, `onError` gracefully loads local fallback artwork without breaking card dimensions.
- **F04-E2 (Edge Case - Long Synopses & Cast Lists)**: Movie with long text/cast fits within scrollable container without clipping buttons or modal header.

---

## Flow F05: Cinema Video Player (XPlayer Engine)
- **F05-H1 (Happy Path - Unobstructed Playback)**: Movie begins playing. Within 4 seconds, all UI controls, header bar, bottom bar, and pills automatically fade out completely. View is 100% unobstructed.
- **F05-H2 (Happy Path - Top Edge Reveal)**: User taps near top edge of the screen while controls are hidden. Top control bar reveals smoothly with title, resolution switcher, audio language, rotation button, and close icon.
- **F05-H3 (Happy Path - Resolution & Language Drawers)**: User taps "Quality" or "Language" in top bar. Clean dropdown drawer opens. Full-screen click-shield backdrop prevents touch clicks from bleeding into underlying video iframe.
- **F05-H4 (Happy Path - Ad & External Link Intercept)**: Video iframe emits rogue redirect or ad link. Android `BridgeWebViewClient` intercepts URL and blocks external Google Chrome from opening (`shouldOverrideUrlLoading` returns `true`).
- **F05-H5 (Happy Path - Screen Rotation)**: User taps orientation button or rotates physical device. Player smoothly adapts between landscape and portrait without restarting stream.
- **F05-E1 (Edge Case - Stream Failure & Server Failover)**: Server 1 fails or encounters network error. Error recovery banner displays option to switch to mirror server instantly.
- **F05-N1 (Negative Case - Exit Player)**: User taps Close (X) or presses hardware back button. Player unmounts cleanly, restores screen orientation, restores bottom banner, and saves resume timestamp in localStorage.

---

## Flow F06: Search & Instant Discovery
- **F06-H1 (Happy Path)**: User types "Dune", "Prabhas", or "Action" into search bar. Real-time debounced results appear instantly showing matching movie cards.
- **F06-H2 (Happy Path - Clear Query)**: User taps "X" clear button on search input. Search query resets and default trending suggestions appear.
- **F06-E1 (Edge Case - Special Characters / Emoji Input)**: User inputs query with accents, emoji, or symbols like `!@#$%^&*()`. Search handles regex/string matching safely without crashing.
- **F06-N1 (Negative Case - No Results)**: User enters non-matching text (e.g., "zzxyqwe"). Clean empty state appears with "No movies found" and suggested popular searches.

---

## Flow F07: My List / Watchlist
- **F07-H1 (Happy Path)**: User adds movie from card or details modal. Navigating to My List tab displays the added movie card with poster and title.
- **F07-H2 (Happy Path - Removal)**: User taps remove icon on a movie in My List. Movie is immediately removed and localStorage updates.
- **F07-E1 (Edge Case - Empty List State)**: User removes all items from My List. Empty state displays friendly icon, "Your List is Empty" message, and "Browse Movies" button which redirects to Home tab.

---

## Flow F08: Offline Downloads Simulation
- **F08-H1 (Happy Path)**: User visits Downloads tab. Shows downloaded movie items with file sizes. Tapping card initiates playback.
- **F08-E1 (Edge Case - Storage Simulation)**: Download list preserves items and shows simulated download status.

---

## Flow F09: Navigation & Multi-Tab State
- **F09-H1 (Happy Path)**: User switches between Home, Search, Downloads, and My List tabs via BottomNav. Active tab highlights in red with smooth cross-fade animation.
- **F09-E1 (Edge Case - Mid-Flow Tab Switching)**: User opens details modal, then switches tabs or hits back. State cleans up properly without modals getting stuck open.
