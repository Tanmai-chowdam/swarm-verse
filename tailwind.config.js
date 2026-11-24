/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        space: {
          950: '#060913',
          900: '#0b1021',
          850: '#101730',
          800: '#162044',
          700: '#233267',
        },
        swarm: {
          primary: '#06b6d4', // cyan-500
          accent: '#3b82f6',  // blue-500
          glow: '#38bdf8',    // sky-400
          gold: '#f59e0b',    // amber-500 for gbest
          best: '#10b981',    // emerald-500 for pbest
          cognitive: '#a855f7', // purple-500
          social: '#ec4899',   // pink-500
          inertia: '#3b82f6',  // blue-500
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
