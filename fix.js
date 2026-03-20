const fs = require('fs')

fs.writeFileSync('vite.config.js', [
  "import { defineConfig } from 'vite'",
  "import react from '@vitejs/plugin-react'",
  "",
  "export default defineConfig({",
  "  plugins: [react()],",
  "})",
].join('\n'))

fs.writeFileSync('postcss.config.cjs', [
  "module.exports = {",
  "  plugins: {",
  "    tailwindcss: {},",
  "    autoprefixer: {},",
  "  },",
  "}",
].join('\n'))

console.log('Both files fixed.')
