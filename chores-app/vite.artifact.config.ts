import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// One-off config that inlines everything (JS, CSS) into a single index.html —
// used only to package the app for artifact/static hosting that can't serve
// multiple hashed asset files. The normal `vite.config.ts` (code-split,
// multi-chunk) is what real deployments should use.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
})
