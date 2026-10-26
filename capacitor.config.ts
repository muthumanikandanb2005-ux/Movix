import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.movix.app',
  appName: 'Movix',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
