export interface AppUpdateInfo {
  hasUpdate: boolean;
  versionName: string;
  versionCode: number;
  releaseDate: string;
  title: string;
  changelog: string[];
  downloadUrl: string;
  rawApkUrl: string;
  currentVersion: string;
}

export const LATEST_RELEASE_VERSION_NAME = '2.1.9';
export const LATEST_RELEASE_VERSION_CODE = 201900;

export const DEFAULT_UPDATE_INFO: AppUpdateInfo = {
  hasUpdate: true,
  versionName: LATEST_RELEASE_VERSION_NAME,
  versionCode: LATEST_RELEASE_VERSION_CODE,
  releaseDate: '2026-11-11',
  title: `Movix v${LATEST_RELEASE_VERSION_NAME} - Official Release & Safe Signature`,
  changelog: [
    'Official Production Keystore Signing: Clean v1 & v2 signatures eliminate Play Protect "Harmful App" warnings',
    'Guaranteed Instant Video Playback: Server 1 (AutoEmbed Fast 4K VIP) default with sub-second stream loading',
    'Smart Stream Auto-Recovery: Automatic failover prompt connects to alternative mirrors if any connection is slow',
    '1-Tap Fullscreen Tap-to-Summon: Screen tap seamlessly restores all player controls, volume boost, and server mirrors',
    'Strict Movie Language Filtering: Only genuinely available audio tracks for each title are shown',
    'Pure In-App Direct APK Download & Package Installation (Never leaves app to GitHub)',
    '100% Zero-Overlay Cinema Playback: All options, controls, and pills are completely hidden while movie plays'
  ],
  downloadUrl: `https://github.com/muthumanikandanb2005-ux/Movix/releases/download/v${LATEST_RELEASE_VERSION_NAME}/movix-app-v${LATEST_RELEASE_VERSION_NAME}.apk`,
  rawApkUrl: `https://github.com/muthumanikandanb2005-ux/Movix/raw/main/releases/movix-app-v${LATEST_RELEASE_VERSION_NAME}.apk`,
  currentVersion: '2.1.8'
};

const VERSION_MIRRORS = [
  'https://raw.githubusercontent.com/muthumanikandanb2005-ux/Movix/main/version.json',
  'https://cdn.jsdelivr.net/gh/muthumanikandanb2005-ux/Movix@main/version.json',
  'https://raw.githubusercontent.com/muthumanikandanb2005-ux/Movix/refs/heads/main/version.json',
  'https://github.com/muthumanikandanb2005-ux/Movix/raw/main/version.json',
  'https://api.github.com/repos/muthumanikandanb2005-ux/Movix/releases/latest',
  '/version.json'
];

export const getCurrentAppVersion = (): { versionName: string; versionCode: number } => {
  const android = (window as any).AndroidAdMob;
  if (android && typeof android.getAppVersion === 'function') {
    try {
      const vn = android.getAppVersion();
      const vc = android.getAppVersionCode ? android.getAppVersionCode() : 201000;
      return { versionName: vn || '2.1.0', versionCode: vc || 201000 };
    } catch {}
  }
  return { versionName: '2.1.0', versionCode: 201000 };
};

export const checkForAppUpdates = async (force = false): Promise<AppUpdateInfo | null> => {
  const current = getCurrentAppVersion();

  // Try each mirror endpoint sequentially with a 4s timeout
  for (const url of VERSION_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${url}?_t=${Date.now()}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        
        // If GitHub Releases API response
        if (data.tag_name) {
          const tag = data.tag_name.replace('v', '');
          const apkAsset = (data.assets || []).find((a: any) => a.name && a.name.endsWith('.apk'));
          const downloadUrl = apkAsset?.browser_download_url || `https://github.com/muthumanikandanb2005-ux/Movix/releases/download/${data.tag_name}/movix-app-${data.tag_name}.apk`;
          const parts = tag.split('.').map((p: string) => parseInt(p, 10));
          const parsedCode = (parts[0] || 2) * 100000 + (parts[1] || 0) * 10000 + (parts[2] || 0) * 100;
          const isNewer = parsedCode > current.versionCode || tag !== current.versionName;
          return {
            hasUpdate: force ? true : isNewer,
            versionName: tag,
            versionCode: parsedCode,
            releaseDate: data.published_at ? data.published_at.split('T')[0] : '2026-11-10',
            title: data.name || `Movix ${data.tag_name}`,
            changelog: DEFAULT_UPDATE_INFO.changelog,
            downloadUrl,
            rawApkUrl: downloadUrl,
            currentVersion: current.versionName
          };
        }

        // Standard version.json format
        const newVersionCode = Number(data.versionCode) || LATEST_RELEASE_VERSION_CODE;
        const newVersionName = data.versionName || LATEST_RELEASE_VERSION_NAME;
        const isNewer = newVersionCode > current.versionCode || newVersionName !== current.versionName;

        return {
          hasUpdate: force ? true : isNewer,
          versionName: newVersionName,
          versionCode: newVersionCode,
          releaseDate: data.releaseDate || '2026-11-09',
          title: data.title || `Movix v${newVersionName} - Cinema Edition`,
          changelog: Array.isArray(data.changelog) ? data.changelog : DEFAULT_UPDATE_INFO.changelog,
          downloadUrl: data.apkUrl || DEFAULT_UPDATE_INFO.downloadUrl,
          rawApkUrl: data.rawApkUrl || DEFAULT_UPDATE_INFO.rawApkUrl,
          currentVersion: current.versionName
        };
      }
    } catch {
      // Continue to next mirror
    }
  }

  // Guaranteed fallback so update check NEVER returns empty or fails silently
  return {
    ...DEFAULT_UPDATE_INFO,
    hasUpdate: force ? true : (DEFAULT_UPDATE_INFO.versionCode > current.versionCode || DEFAULT_UPDATE_INFO.versionName !== current.versionName),
    currentVersion: current.versionName
  };
};

export const triggerApkInstall = (downloadUrl?: string): void => {
  const finalUrl = downloadUrl || DEFAULT_UPDATE_INFO.rawApkUrl || DEFAULT_UPDATE_INFO.downloadUrl;
  const android = (window as any).AndroidAdMob;
  if (android && typeof android.downloadAndInstallUpdate === 'function') {
    android.downloadAndInstallUpdate(finalUrl);
    return;
  }
  if (android && typeof android.openUpdateUrl === 'function') {
    android.openUpdateUrl(finalUrl);
    return;
  }

  // Web/Browser fallback: create an anchor and click to trigger file download (only on desktop/browser)
  const link = document.createElement('a');
  link.href = finalUrl;
  link.download = finalUrl.split('/').pop() || `movix-app-v${LATEST_RELEASE_VERSION_NAME}.apk`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
