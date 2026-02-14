import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // Root directory is current directory since index.html is there
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                contact: resolve(__dirname, 'contact.html'),
                about: resolve(__dirname, 'about.html'),
                services: resolve(__dirname, 'services.html'),
                quiz: resolve(__dirname, 'quiz.html'),
                tryit: resolve(__dirname, 'tryit.html'),
                auth: resolve(__dirname, 'auth.html'),
            }
        }
    },
    server: {
        open: true
    }
});
