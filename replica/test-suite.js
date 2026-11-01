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
  
  // Extract all posters and backdrops
  const posterMatches = [...content.matchAll(/poster:\s*'([^']+)'/g)].map(m => m[1]);
  const backdropMatches = [...content.matchAll(/backdrop:\s*'([^']+)'/g)].map(m => m[1]);
  
  assert(posterMatches.length >= 30, 'F01-E1.2', `Sufficient posters declared (${posterMatches.length} found)`);
  assert(backdropMatches.length >= 30, 'F01-E1.3', `Sufficient backdrops declared (${backdropMatches.length} found)`);

  // Verify all local assets exist on disk with valid file size (> 1000 bytes)
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

  // Verify remote TMDB CDN assets return HTTP 200
  const remoteUrls = [...new Set([...posterMatches, ...backdropMatches].filter(u => u.startsWith('http')))];
  console.log(`Checking ${remoteUrls.length} remote TMDB CDN image URLs...`);
  
  const checkUrl = (url) => new Promise(resolve => {
    https.get(url, res => {
      resolve({ url, status: res.statusCode });
    }).on('error', err => resolve({ url, status: err.message }));
  });

  const remoteResults = await Promise.all(remoteUrls.map(checkUrl));
  const failedRemote = remoteResults.filter(r => r.status !== 200);
  
  assert(failedRemote.length === 0, 'F01-E1.5', `All ${remoteUrls.length} remote TMDB image URLs return 200 OK (0 failures)`);
  if (failedRemote.length > 0) {
    failedRemote.forEach(f => console.error(`  Failed: ${f.status} -> ${f.url}`));
  }

  // ----------------------------------------------------
  // TEST SUITE 2: Curated Genre Verification (F03-H1)
  // ----------------------------------------------------
  console.log('\n--- SUITE 2: Curated Genre Verification ---');
  
  // Verify Sci-Fi picks contains only actual Sci-Fi movies
  const sciFiBlock = content.slice(content.indexOf('export const sciFiPicks: Movie[] = ['));
  const hasKalki = sciFiBlock.includes('featuredIndianMovie');
  const hasDune = sciFiBlock.includes('DUNE: PART TWO') || sciFiBlock.includes('hollywoodBlockbusters[0]');
  const hasInterstellar = sciFiBlock.includes('INTERSTELLAR') || sciFiBlock.includes('hollywoodBlockbusters[2]');
  const hasInception = sciFiBlock.includes('INCEPTION') || sciFiBlock.includes('thrillerMovies[1]');
  const hasNoRedNotice = !sciFiBlock.includes('netflixTop10[3]'); // Red notice removed
  const hasNoRebelRidge = !sciFiBlock.includes('netflixTop10[7]'); // Rebel ridge removed

  assert(hasKalki && hasDune && hasInterstellar && hasInception, 'F03-H1.1', 'Sci-Fi Universe contains Kalki, Dune, Interstellar, Inception');
  assert(hasNoRedNotice && hasNoRebelRidge, 'F03-H1.2', 'Sci-Fi Universe excludes non-sci-fi movies (Red Notice, Rebel Ridge)');

  // ----------------------------------------------------
  // TEST SUITE 3: Streaming Engine & Sources (F05-H1, F05-H4)
  // ----------------------------------------------------
  console.log('\n--- SUITE 3: Streaming Engine & Ad Blocking ---');
  
  const tmdbServicesPath = path.resolve('src/services/tmdb.ts');
  const tmdbContent = fs.readFileSync(tmdbServicesPath, 'utf8');
  assert(tmdbContent.includes('export const getStreamingSources'), 'F05-H1.1', 'getStreamingSources service exported');
  assert(tmdbContent.includes('vidlink.pro'), 'F05-H1.2', 'VidLink primary streaming provider configured');
  assert(tmdbContent.includes('vidsrc.cc') || tmdbContent.includes('embedsu.net'), 'F05-H1.3', 'Multiple mirror fallback servers configured');

  // Verify Android WebViewClient blocks Chrome popups
  const mainActivityPath = path.resolve('android/app/src/main/java/com/movix/app/MainActivity.java');
  assert(fs.existsSync(mainActivityPath), 'F05-H4.1', 'MainActivity.java exists');
  const mainActivityContent = fs.readFileSync(mainActivityPath, 'utf8');
  assert(mainActivityContent.includes('BridgeWebViewClient'), 'F05-H4.2', 'BridgeWebViewClient overridden');
  assert(mainActivityContent.includes('shouldOverrideUrlLoading') && mainActivityContent.includes('return true;'), 'F05-H4.3', 'Rogue ad popups strictly intercepted & blocked from launching Chrome');

  // ----------------------------------------------------
  // TEST SUITE 4: Player UI Cleanliness (F05-H1, F05-H2, F05-H3)
  // ----------------------------------------------------
  console.log('\n--- SUITE 4: Player UI Cleanliness & Control Bars ---');
  
  const playerPath = path.resolve('src/components/VideoPlayerModal.tsx');
  assert(fs.existsSync(playerPath), 'F05-H1.4', 'VideoPlayerModal.tsx exists');
  const playerContent = fs.readFileSync(playerPath, 'utf8');
  
  // Verify auto-hiding controls
  assert(playerContent.includes('showControls && !isLocked ? \'opacity-100\' : \'opacity-0 pointer-events-none\''), 'F05-H1.5', 'Controls fade to 0 opacity with pointer-events-none while playing');
  
  // Verify top invisible touch reveal zone
  assert(playerContent.includes('h-24 z-30 cursor-pointer') && playerContent.includes('setShowControls(true)'), 'F05-H2.1', 'Top edge touch reveal zone exists for clean playback');

  // Verify dropdown click-shield backdrop
  assert(playerContent.includes('bg-black/40 backdrop-blur') && playerContent.includes('setShowQualityMenu(false)'), 'F05-H3.1', 'Full-screen click shield prevents touch bleed to iframe');

  // ----------------------------------------------------
  // TEST SUITE 5: Production Build Integrity
  // ----------------------------------------------------
  console.log('\n--- SUITE 5: Production Build Verification ---');
  const distHtml = path.resolve('dist/index.html');
  assert(fs.existsSync(distHtml), 'BUILD-1', 'dist/index.html successfully generated by Vite');

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
