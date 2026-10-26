import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reyra.inventory',
  appName: 'REYRA Inventory',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
