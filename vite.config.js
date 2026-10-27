import { defineConfig } from 'vite';
export default defineConfig({base: process.env.GITHUB_PAGES === 'true' ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'IB-Chess-Analyzer'}/` : '/',build:{outDir:'dist'}});
