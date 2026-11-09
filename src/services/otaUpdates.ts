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

const CURRENT_VERSION_NAME = '2.0.8';
const CURRENT_VERSION_CODE = 200800;

const GITHUB_REPO_RAW_VERSION_URL = 'https://raw.githubusercontent.com/muthumanikandanb2005-ux/Movix/main/version.json';
const GITHUB_API_LATEST_RELEASE = 'https://api.github.com/repos/muthumanikandanb2005-ux/Movix/releases/latest';

export const getCurrentAppVersion = (): { versionName: string; versionCode: number } => {
  const android = (window as any).AndroidAdMob;
  if (android && typeof android.getAppVersion === 'function') {
    try {
      const vn = android.getAppVersion();
      const vc = android.getAppVersionCode ? android.getAppVersionCode() : CURRENT_VERSION_CODE;
      return { versionName: vn || CURRENT_VERSION_NAME, versionCode: vc || CURRENT_VERSION_CODE };
    } catch {}
  }
  return { versionName: CURRENT_VERSION_NAME, versionCode: CURRENT_VERSION_CODE };
};

export const checkForAppUpdates = async (force = false): Promise<AppUpdateInfo | null> => {
  const current = getCurrentAppVersion();
  
  try {
    // 1. First attempt to check the GitHub repository raw version.json
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${GITHUB_REPO_RAW_VERSION_URL}?_t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const newVersionCode = Number(data.versionCode) || 0;
      const isNewer = newVersionCode > current.versionCode;

      return {
        hasUpdate: force ? true : isNewer,
        versionName: data.versionName || '2.0.7',
        versionCode: newVersionCode,
        releaseDate: data.releaseDate || new Date().toISOString().split('T')[0],
        title: data.title || `Movix Update ${data.versionName}`,
        changelog: Array.isArray(data.changelog) ? data.changelog : [
          'Ultra-fast movie streaming with zero sandbox error',
          'Indian movie titles & posters fixed',
          'OTA Updates integrated'
        ],
        downloadUrl: data.apkUrl || 'https://github.com/muthumanikandanb2005-ux/Movix/releases/download/v2.0.6/movix-app-v2.0.6.apk',
        rawApkUrl: data.rawApkUrl || 'https://github.com/muthumanikandanb2005-ux/Movix/raw/main/releases/movix-app-v2.0.6.apk',
        currentVersion: current.versionName
      };
    }
  } catch (err) {
    console.warn('Raw version.json check failed, falling back to GitHub API:', err);
  }

  // 2. Fallback check directly against GitHub Releases API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const apiRes = await fetch(GITHUB_API_LATEST_RELEASE, {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github.v3+json' }
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const release = await apiRes.json();
      const tag = (release.tag_name || '').replace('v', '');
      const apkAsset = (release.assets || []).find((a: any) => a.name && a.name.endsWith('.apk'));
      const downloadUrl = apkAsset?.browser_download_url || `https://github.com/muthumanikandanb2005-ux/Movix/releases/download/${release.tag_name}/movix-app-v2.0.6.apk`;

      const isNewer = tag !== current.versionName && tag > current.versionName;

      return {
        hasUpdate: force ? true : isNewer,
        versionName: tag || '2.0.7',
        versionCode: current.versionCode + 100,
        releaseDate: release.published_at ? release.published_at.split('T')[0] : '2026-11-08',
        title: release.name || `Movix ${release.tag_name}`,
        changelog: release.body ? release.body.split('\n').filter((l: string) => l.startsWith('-')).map((l: string) => l.replace(/^-\s*/, '')) : [
          'Performance and cinema player improvements',
          'Fast streaming engine updates'
        ],
        downloadUrl,
        rawApkUrl: downloadUrl,
        currentVersion: current.versionName
      };
    }
  } catch (apiErr) {
    console.warn('GitHub Releases API check failed:', apiErr);
  }

  return null;
};

export const triggerApkInstall = (downloadUrl: string): void => {
  const android = (window as any).AndroidAdMob;
  if (android && typeof android.openUpdateUrl === 'function') {
    android.openUpdateUrl(downloadUrl);
    return;
  }

  // Fallback for Web/Browser: create an anchor and click to trigger file download
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = downloadUrl.split('/').pop() || 'movix-app-update.apk';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
