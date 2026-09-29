// Tailwind build for /2027 (2027.html). Rebuild after changing classes in 2027.html:
//   npx tailwindcss@3 -c scripts/tailwind/outlook-2027.config.js -i scripts/tailwind/outlook-2027.input.css -o css/outlook-2027.css --minify
module.exports = {
  content: ['./2027.html'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0C10',
        coal: '#13151B',
        gold: '#D4AF37',
        ember: '#E06D53',
        ivory: '#EDE6D6',
        ash: '#8A8F98',
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
