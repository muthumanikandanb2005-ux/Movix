# 🎬 Movix - Streaming Movies & Series

<p align="center">
  <img src="public/assets/movix_3d_logo.png" alt="Movix 3D Logo" width="160" />
</p>

<p align="center">
  A sleek, modern, cinema-first mobile streaming client built with <b>React 19</b>, <b>Vite</b>, <b>Tailwind CSS</b>, and <b>Capacitor Android</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20Web-E50914?style=for-the-badge&logo=android" alt="Platform" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/AdMob-Integrated-F4B400?style=for-the-badge&logo=google" alt="AdMob" />
</p>

---

## ✨ Features

- **🔥 Cinematic Netflix-Style UI:** Deep cosmic dark theme with high-impact hero banner, glowing accents, and responsive typography.
- **✨ Custom 3D Logo Branding:** Custom 3D film-strip **M** icon with ambient neon glow in header, app splash loader, and buffering state.
- **🎬 Featured Hero Showcase:** *Top 10 This Week* pill, title, metadata (Year, Genre, Duration, Rating), synopsis, and quick-action buttons.
- **📈 Trending Now Carousel:** Smooth horizontal scrolling poster cards with real titles and rating badges.
- **🎥 Built-in Streaming Video Player:** Custom HTML5 & native player controls with play/pause, seek slider, 10-second skip forward/back, full-screen, and volume toggles.
- **⏳ Dynamic Movie Loader:** Displays the 3D Movix logo with spinning orbital gradient ring while streaming or buffering.
- **💰 Google AdMob Monetization:**
  - **App ID:** `ca-app-pub-5684555136963044~1297480157`
  - **Ad Unit ID:** `ca-app-pub-5684555136963044/1233900974`
  - Integrated banner component and pre-stream interstitial ad.
- **🔍 Instant Search & Filter:** Real-time search with genre chips (Sci-Fi, Action, Mystery, Cyberpunk).
- **📥 Offline Downloads Simulator:** Manage downloaded movies and device storage.
- **⭐ My List Watchlist:** Add/remove bookmarks with live counter.
- **📱 Native Android Ready:** Pre-configured with Capacitor for native Android APK generation.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ 
- **npm** or **pnpm**
- **Android SDK & JDK 17/21** (for Android APK builds)

### Installation

```bash
# Clone the repository
git clone https://github.com/muthumanikandanb2005-ux/Movix.git
cd Movix

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build Web App

```bash
npm run build
```

### Build Android APK

```bash
# Sync web build to Android project
npx cap sync android

# Build debug APK using Gradle
cd android
./gradlew assembleDebug
```
The compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📂 Project Structure

```
movix/
├── android/               # Capacitor Android native project & Gradle build
├── public/
│   └── assets/            # 3D Movix logo, poster artworks, avatar, icons
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Sticky top bar with 3D logo & profile
│   │   ├── Hero.tsx              # Featured title banner & quick actions
│   │   ├── MovieCarousel.tsx     # Horizontal movie rows
│   │   ├── BottomNav.tsx         # Bottom dock (Home, Search, Downloads, List)
│   │   ├── VideoPlayerModal.tsx  # Video player with 3D logo buffer overlay
│   │   ├── MovieDetailsModal.tsx # Movie details bottom sheet
│   │   ├── AdMobBanner.tsx       # Google AdMob sponsored banner
│   │   ├── AdMobInterstitial.tsx # Pre-stream AdMob interstitial modal
│   │   ├── LoadingScreen.tsx     # App splash screen with glowing 3D logo
│   │   ├── SearchView.tsx        # Filter & search catalogue
│   │   ├── DownloadsView.tsx     # Offline library & storage tracker
│   │   └── MyListView.tsx        # Saved watchlist
│   ├── data/
│   │   └── movies.ts             # Featured, trending, and sci-fi catalogues
│   ├── types.ts                  # Movie & navigation TypeScript definitions
│   ├── App.tsx                   # Root state & navigation orchestration
│   └── main.tsx                  # React DOM entry point
├── capacitor.config.ts    # Capacitor Android configuration
├── tailwind.config.js     # Tailwind design tokens & custom colors
└── vite.config.ts         # Vite bundler configuration
```

---

## 📄 License

MIT License. Designed and developed with care.
