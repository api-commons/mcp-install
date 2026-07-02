import { defineConfig } from 'vite';

// Second build pass: the embeddable <mcp-install-button> web component as a
// single self-contained IIFE at /button.js. Runs after the app build with
// emptyOutDir off so both land in dist/.
export default defineConfig({
  build: {
    target: 'es2022',
    emptyOutDir: false,
    lib: {
      entry: 'src/widget.ts',
      name: 'MCPInstallButton',
      formats: ['iife'],
      fileName: () => 'button.js',
    },
  },
});
