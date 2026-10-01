// Tailwind build for the homepage (index.html). Rebuild after changing classes in index.html:
//   npx tailwindcss@3 -c scripts/tailwind/home.config.js -i scripts/tailwind/outlook-2027.input.css -o css/home.css --minify
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0C10',
        coal: '#13151B',
        gold: '#D4AF37',
        champagne: '#F3D98B',
        ember: '#E06D53',
        ink: '#7F9BD1',
        jade: '#6FB39A',
        ivory: '#EDE6D6',
        ash: '#A8ADB6',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
        han: ['"Noto Serif TC"', 'serif'],
      },
    },
  },
};
