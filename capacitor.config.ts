import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.davicode.tempo',
  appName: 'TempoApp',
  webDir: 'dist',
  server: {
    hostname: 'tempo.davicode.me',
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
