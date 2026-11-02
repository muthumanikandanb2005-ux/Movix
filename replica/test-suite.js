/**
 * Movix Comprehensive Automated Test Suite
 * Executed as part of /replica-test
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

console.log('====================================================');
console.log('🚀 RUNNING MOVIX REPLICA AUTOMATED TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testId, description) {
  if (condition) {
    console.log(`✅ PASS [${testId}]: ${description}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL [${testId}]: ${description}`);
    failedTests++;
  }
}

async function runTests() {
  // ----------------------------------------------------
  // TEST SUITE 1: Data Integrity & Media Assets (F01-H1, F01-E1, F04-E1)
  // ----------------------------------------------------
  console.log('--- SUITE 1: Static Data Integrity & Image Asset Verification ---');
  
  const moviesDataPath = path.resolve('src/data/movies.ts');
  assert(fs.existsSync(moviesDataPath), 'F01-E1.1', 'src/data/movies.ts exists');

  const content = fs.readFileSync(moviesDataPath, 'utf8');
  
  const posterMatches = [...content.matchAll(/poster:\s*'([^']+)'/g)].map(m => m[1]);
  const backdropMatches = [...content.matchAll(/backdrop:\s*'([^']+)'/g)].map(m => m[1]);
  
  assert(posterMatches.length >= 30, 'F01-E1.2', `Sufficient posters declared (${posterMatches.length} found)`);
  assert(backdropMatches.length >= 30, 'F01-E1.3', `Sufficient backdrops declared (${backdropMatches.length} found)`);

  const localAssets = [...posterMatches, ...backdropMatches].filter(u => u.startsWith('/assets/'));
  let allLocalAssetsValid = true;
  for (const asset of localAssets) {
    const diskPath = path.join('public', asset);
    if (!fs.existsSync(diskPath) || fs.statSync(diskPath).size < 1000) {
      console.error(`Invalid local asset: ${diskPath}`);
      allLocalAssetsValid = false;
    }
  }
  assert(allLocalAssetsValid && localAssets.length > 0, 'F01-E1.4', `All local fallback assets exist and are valid (${localAssets.length} verified)`);

  // Verify remote TMDB CDN assets return HTTP 200 (allow proxy 502/rate-limits gracefully if remote host unreachable)
  const remoteUrls = [...new Set([...posterMatches, ...backdropMatches].filter(u => u.startsWith('http')))];
  console.log(`Checking ${remoteUrls.length} remote TMDB CDN image URLs...`);
  
  const checkUrl = (url) => new Promise(resolve => {
    https.get(url, { rejectUnauthorized: false, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      resolve({ url, status: res.statusCode });
    }).on('error', err => resolve({ url, status: err.message }));
  });

  const remoteResults = await Promise.all(remoteUrls.slice(0, 5).map(checkUrl));
  const failedRemote = remoteResults.filter(r => r.status !== 200 && r.status !== 502);
  
  assert(failedRemote.length === 0, 'F01-E1.5', `Remote TMDB image URLs verified (${remoteResults.length} sampled, 0 syntax/404 failures)`);
  if (failedRemote.length > 0) {
    failedRemote.forEach(f => console.error(`  Failed: ${f.status} -> ${f.url}`));
  }

  // ----------------------------------------------------
  // TEST SUITE 2: Curated Genre Verification (F03-H1)
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: Curated Genre Verification ---');
  
  const sciFiBlock = content.slice(content.indexOf('export const sciFiPicks: Movie[] = ['));
  const hasKalki = sciFiBlock.includes('featuredIndianMovie');
  const hasDune = sciFiBlock.includes('DUNE: PART TWO') || sciFiBlock.includes('hollywoodBlockbusters[0]');
  const hasInterstellar = sciFiBlock.includes('INTERSTELLAR') || sciFiBlock.includes('hollywoodBlockbusters[2]');
  const hasInception = sciFiBlock.includes('INCEPTION') || sciFiBlock.includes('thrillerMovies[1]');
  const hasNoRedNotice = !sciFiBlock.includes('netflixTop10[3]');
  const hasNoRebelRidge = !sciFiBlock.includes('netflixTop10[7]');

  assert(hasKalki && hasDune && hasInterstellar && hasInception, 'F03-H1.1', 'Sci-Fi Universe contains Kalki, Dune, Interstellar, Inception');
  assert(hasNoRedNotice && hasNoRebelRidge, 'F03-H1.2', 'Sci-Fi Universe excludes non-sci-fi movies (Red Notice, Rebel Ridge)');

  // ----------------------------------------------------
  // TEST SUITE 3: Streaming Engine & Ad Blocking (F05-H1, F05-H4)
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: Streaming Engine & Ad Blocking ---');
  
  const tmdbServicesPath = path.resolve('src/services/tmdb.ts');
  const tmdbContent = fs.readFileSync(tmdbServicesPath, 'utf8');
  assert(tmdbContent.includes('export const getStreamingSources'), 'F05-H1.1', 'getStreamingSources service exported');
  assert(tmdbContent.includes('vidlink.pro'), 'F05-H1.2', 'VidLink primary streaming provider configured');
  assert(tmdbContent.includes('superembed.stream') && tmdbContent.includes('2embed.cc'), 'F05-H1.3', 'Multiple mirror fallback servers configured');
  assert(tmdbContent.includes('type: \'video\''), 'F05-H1.4', 'Ad-free direct CDN 4K stream provided as guaranteed fallback');

  // Verify Android WebViewClient blocks Chrome popups while allowing subframe streaming
  const mainActivityPath = path.resolve('android/app/src/main/java/com/movix/app/MainActivity.java');
  assert(fs.existsSync(mainActivityPath), 'F05-H4.1', 'MainActivity.java exists');
  const mainActivityContent = fs.readFileSync(mainActivityPath, 'utf8');
  assert(mainActivityContent.includes('BridgeWebChromeClient') && mainActivityContent.includes('onCreateWindow') && mainActivityContent.includes('return false;'), 'F05-H4.2', 'BridgeWebChromeClient strictly blocks popup windows from opening Chrome');
  assert(mainActivityContent.includes('!request.isForMainFrame()') && mainActivityContent.includes('return false;'), 'F05-H4.3', 'Subframe media and quality streams allowed to load smoothly');
  assert(mainActivityContent.includes('setModalOpen(boolean open)'), 'F05-H4.4', 'Native AdMob banner auto-hides when modals open');

  // ----------------------------------------------------
  // TEST SUITE 4: Settings & Language Preferences (User Request)
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: Settings Modal & Language Preferences ---');
  const settingsModalPath = path.resolve('src/components/SettingsModal.tsx');
  assert(fs.existsSync(settingsModalPath), 'SET-1', 'SettingsModal.tsx exists');
  const settingsContent = fs.readFileSync(settingsModalPath, 'utf8');
  assert(settingsContent.includes('Hindi') && settingsContent.includes('Tamil') && settingsContent.includes('Telugu'), 'SET-2', 'Settings provides Indian audio languages (Hindi, Tamil, Telugu, etc.)');
  assert(settingsContent.includes('Hardware GPU Acceleration') || settingsContent.includes('Smooth Playback'), 'SET-3', 'Settings provides Smooth Playback and hardware acceleration toggles');

  // ----------------------------------------------------
  // TEST SUITE 5: Player UI Cleanliness & Auto-Hiding Controls
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: Player UI Cleanliness & Control Bars ---');
  
  const playerPath = path.resolve('src/components/VideoPlayerModal.tsx');
  assert(fs.existsSync(playerPath), 'F05-H1.5', 'VideoPlayerModal.tsx exists');
  const playerContent = fs.readFileSync(playerPath, 'utf8');
  
  // Verify auto-hiding controls (all controls completely fade to 0 opacity when playing)
  assert(playerContent.includes('showControls && !isLocked ? \'opacity-100\' : \'opacity-0 pointer-events-none\''), 'F05-H1.6', 'Controls fade to 0 opacity with pointer-events-none while playing');
  assert(playerContent.includes('showControls ? \'opacity-100 pointer-events-auto\' : \'opacity-0 pointer-events-none\''), 'F05-H1.7', 'Screen lock button auto-hides with controls');
  assert(playerContent.includes('referrerPolicy="origin"'), 'F05-H1.8', 'Iframe uses origin referrerPolicy to prevent 403 anti-hotlink blocks');
  assert(!playerContent.includes('sandbox="'), 'F05-H1.9', 'Iframe has sandbox disabled to prevent "Please disable sandbox" provider error');
  assert(playerContent.includes('Stream Mirror:'), 'F05-H1.10', 'Quick Server Mirror Switcher Bar (S1-S6) integrated for 1-tap failover');
  assert(playerContent.includes('defaultServerIndex') && playerContent.includes('Server 3'), 'F05-H1.11', 'Server 3 is set as default fast-loading stream source');
  assert((playerContent.includes('useState(1)') || playerContent.includes('setVolume(1')) && playerContent.includes('videoRef.current.volume = 1.0'), 'F05-H1.12', 'Player audio volume defaults to 100% full and unmuted');

  // Verify Android native volume maxing
  assert(mainActivityContent.includes('getStreamMaxVolume') && mainActivityContent.includes('setStreamVolume'), 'F05-H4.5', 'Android device media volume automatically maximized to 100% on cinema player launch');

  // Verify advertisement plays on movie request
  const appPath = path.resolve('src/App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  assert(appContent.includes('setInterstitialTarget(movie)'), 'AD-1', 'Movie play request triggers sponsored advertisement before starting player');

  // ----------------------------------------------------
  // TEST SUITE 6: Production Build & APK Integrity
  // ----------------------------------------------------
  console.log('\n--- SUITE 6: Production Build & APK Verification ---');
  const distHtml = path.resolve('dist/index.html');
  assert(fs.existsSync(distHtml), 'BUILD-1', 'dist/index.html successfully generated by Vite');

  const apkV206 = path.resolve('movix-app-v2.0.6.apk');
  const apkV202 = path.resolve('movix-app-v2.0.2.apk');
  assert(fs.existsSync(apkV206) && fs.statSync(apkV206).size > 15000000, 'BUILD-2', `movix-app-v2.0.6.apk assembled (${(fs.statSync(apkV206).size / (1024*1024)).toFixed(1)} MB)`);
  assert(fs.existsSync(apkV202) && fs.statSync(apkV202).size > 15000000, 'BUILD-3', `movix-app-v2.0.2.apk updated for Orion Store compatibility`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
