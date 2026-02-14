import { defineConfig } from 'vite';

export default defineConfig({
    // Root directory is current directory since index.html is there
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        open: true
    }
});
