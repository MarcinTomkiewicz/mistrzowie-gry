import { defineConfig } from 'vite';

export default defineConfig({
  ssr: {
    noExternal: ['primeng', 'primeicons', '@primeuix/themes', '@primeuix/styled', '@primeuix/utils'],
  },
});
