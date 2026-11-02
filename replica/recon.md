# Movix Application Reconnaissance Map (`replica/recon.md`)

## 1. App Overview & Scope
- **App Name**: MOVIX (PvrPlay Core Streaming Engine)
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Capacitor 8 (Android)
- **Platform**: Android Native App (`com.movix.app`) & Web Progressive App (`https://movix-ui-app.vercel.app`)
- **Visual Design**: Dark Cinema Netflix Palette (`#080A0F`, `#E50914`, `#121622`, text `#FFFFFF`)
- **Monetization**: Google Mobile Ads SDK (AdMob Native Banner `ca-app-pub-5684555136963044/2645561704`, Interstitial `1233900974`) with VIP Ad-Free Pass unlocked via rewarded video.

---

## 2. Screen Inventory

| ID | Screen Name | Route / Trigger | Purpose | Key Components | States Handled |
|---|---|---|---|---|---|
| **S01** | Splash & Loading Screen | Cold app launch | Brand identification & pre-flight catalog hydration | Movix 3D Logo, Neon Spinner, Version badge | Loading, Hydrated, Fallback |
| **S02** | Home Catalog Feed | Default tab (`tab === 'home'`) | Discovery of trending movies & cinema hubs | Header, Hero, OttProviderBar, ContinueWatchingRow, MovieCarousel | Empty, Filled, Scrolled, Offline |
| **S03** | Category Filter Grid | Tapping any chip in `OttProviderBar` | Focused browsing by genre / hub (Indian, Hollywood, OTT, etc.) | Header, Category Hero, Grid Cards, "Show All" toggle | Filtered, Empty, Loading |
| **S04** | Movie Details Modal | Tapping any movie card | Complete movie metadata, cast, synopsis, and action sheet | Hero Backdrop, Rating pill, Cast row, Play/Stream buttons, Watchlist toggle | Open, Closed, Trailer active |
| **S05** | Cinema Video Player (XPlayer) | Tapping "Play" / "Watch Now" / Stream | Fullscreen edge-to-edge video playback with multi-mirror failover | Iframe embed canvas, HTML5 video canvas, Top control bar, Lock button, Server failover pill | Buffering, Playing, Controls visible, Controls hidden (100% clean), Locked |
| **S06** | Search & Discovery | BottomNav "Search" / Header search icon | Instant live search across title, actors, director, genres | Search input, Quick genre chips, 2-column result grid | Initial/empty query, Results found, Zero results found |
| **S07** | Downloads View | BottomNav "Downloads" | Offline saved content simulation | Downloads list, storage usage bar, play/delete actions | Empty state, Items loaded |
| **S08** | My List Watchlist | BottomNav "My List" | Saved user watchlist | Watchlist grid, Remove button, 1-tap playback | Empty with "Browse" CTA, Items populated |
| **S09** | Settings Drawer | Header Settings button / Profile avatar | Audio language preferences, video quality defaults, GPU acceleration, and cache reset | Language tab (7 languages), Playback tab, General info, Cache flush | Open, Tab active, Saved feedback toast |

---

## 3. User Flows

### Flow F01: App Cold Start & Feed Hydration
`S01 (Splash) -> S02 (Home Catalog)`
1. User taps Movix icon on Android launcher.
2. `LoadingScreen` mounts, displaying animated Movix 3D logo and prefetching TMDB live feeds.
3. Local storage is inspected for `continueWatching` and user preferences (`movix_pref_language`, `movix_pref_quality`).
4. `LoadingScreen` unmounts smoothly; `S02` mounts with Hero billboard (*Kalki 2898 AD*) and 11 distinct carousels.

### Flow F02: 1-Tap Instant Movie Playback
`S02 (Home) -> S05 (Cinema Video Player)`
1. User views Hero billboard or any movie card.
2. User taps "Play" or "Watch Now".
3. Fullscreen `VideoPlayerModal` mounts immediately with Server 1 (VidLink Full Cinema 4K).
4. Auto-hide watchdog triggers after 3 seconds: all buttons, lock icons, and headers fade out completely (`opacity-0 pointer-events-none`).
5. User enjoys 100% unobstructed full-screen cinema video.

### Flow F03: Multi-Server Mirror Failover & Quality Switch
`S05 (Cinema Player) -> Server 1 / Server 2 / Server 3 / Server 6 (Direct CDN)`
1. If Server 1 takes > 4.5 seconds or is restricted on user's ISP, the user taps the screen.
2. Controls appear with the Quick Server Mirror Switcher Bar: `[S1] [S2] [S3] [S4] [S5] [Direct 4K]`.
3. User taps `[S2]` (SuperEmbed) or `[Direct 4K]` (Ad-free direct CDN).
4. Player instantly updates stream source without infinite buffering locks.
5. User taps screen again or waits 3s -> controls cleanly auto-hide.

### Flow F04: Audio Language Preference & Settings Configuration
`S02 (Home) -> S09 (Settings Drawer) -> Persisted to Player S05`
1. User taps the Settings gear icon in the top header.
2. `SettingsModal` opens showing Language tab: Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), Malayalam (മലയാളം), Kannada (ಕನ್ನಡ), English (Original 5.1), Spanish (Español).
3. User selects preferred audio language (e.g. Tamil or Hindi).
4. Preference is immediately saved to `localStorage` (`movix_pref_language`).
5. Subsequent movie playback automatically applies the selected audio language.

### Flow F05: OTT Hub Category Filtering
`S02 (Home) -> S03 (Category Filter Grid)`
1. User scrolls to `OttProviderBar` and selects "Indian Cinema" or "Hollywood 4K".
2. Catalog transitions to `S03` grid view displaying filtered subset.
3. User can tap "Show All Categories" to instantly return to the full multi-carousel catalog.

### Flow F06: Search & Live Autocomplete Discovery
`S02 (Home) -> S06 (Search View)`
1. User taps "Search" in BottomNav.
2. User types movie name or actor (e.g., "Kalki", "Shah Rukh", "Deepika").
3. Grid updates instantaneously with debounced real-time matches across 36+ curated movies.
4. Tapping a result opens `S04 (Movie Details Modal)`.

### Flow F07: Watchlist Management
`S02 (Home) -> S04 (Details) -> S08 (My List)`
1. User taps "+ My List" on any movie card or details modal.
2. Toast confirms: "Added [Title] to My List".
3. User navigates to My List tab in BottomNav to view all saved titles with instant play options.

### Flow F08: Ad Containment & Chrome Hijack Prevention
`S04 (Details) / S05 (Player) -> Ad Suppression Engine`
1. User taps "Play" or "Watch Now" in `MovieDetailsModal`.
2. Native AdMob banner is automatically hidden (`setModalOpen(true)`).
3. Android `BridgeWebChromeClient` swallows all `onCreateWindow` popup requests.
4. Android `BridgeWebViewClient` blocks all non-localhost main frame navigations and non-http schemes (`intent://`, `market://`).
5. User is never kicked out to Google Chrome; playback stays strictly inside Movix.

---

## 4. UI Component Inventory
1. **Header (`Header.tsx`)**: Movix logo, VIP 4K Pass badge, Settings button, Search shortcut, profile avatar.
2. **Hero (`Hero.tsx`)**: Full-bleed backdrop, 4K UHD badge, title, metadata strip, Play, Stream, and My List buttons.
3. **OttProviderBar (`OttProviderBar.tsx`)**: Horizontal pill bar for category switching with active glow.
4. **ContinueWatchingRow (`ContinueWatchingRow.tsx`)**: Progress bars, timestamp resume chips, and 1-tap resume action.
5. **MovieCarousel (`MovieCarousel.tsx`)**: 60fps horizontal carousel, rank badges (1-10), async decoding images, touch momentum.
6. **MovieDetailsModal (`MovieDetailsModal.tsx`)**: 3-tab drawer (Overview, Details, Trailer) with cast portraits, rating, and stream picker.
7. **VideoPlayerModal (`VideoPlayerModal.tsx`)**: XPlayer cinema engine with orientation toggle, gestures, quick server mirror switcher, resolution drawer, and Dolby audio drawer.
8. **SettingsModal (`SettingsModal.tsx`)**: 3-tab configuration drawer for audio language, streaming resolution, GPU acceleration, and cache clear.
9. **BottomNav (`BottomNav.tsx`)**: 4-tab mobile navigation (Home, Search, Downloads, My List) with active red pill indicator.
10. **AdMobBanner (`AdMobBanner.tsx`)**: Sponsored VIP Pass card with rewarded ad trigger.

---

## 5. Inferred Data Model
```typescript
interface Movie {
  id: string | number;
  tmdbId?: number;
  title: string;
  poster: string;
  backdrop: string;
  genre: string;
  rating: number;
  year: number;
  duration: string;
  description: string;
  badge?: string;
  cast?: CastMember[];
  availableLanguages?: AudioLanguage[];
  videoUrl?: string;
}

interface StreamSource {
  name: string;
  url: string;
  type: 'embed' | 'video' | 'trailer';
  quality?: VideoQuality;
}

type VideoQuality = '4K' | '1080p' | '720p' | '480p';
type AudioLanguage = 'Hindi' | 'Tamil' | 'Telugu' | 'Malayalam' | 'Kannada' | 'English' | 'Spanish';

interface ContinueWatchingItem {
  id: string;
  tmdbId: number;
  title: string;
  poster: string;
  currentTime: number;
  duration: number;
  percentage: number;
  lastUpdated: number;
}
```
