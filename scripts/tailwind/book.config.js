// Tailwind build for /book (book.html). Rebuild after changing classes in book.html:
//   npx tailwindcss@3 -c scripts/tailwind/book.config.js -i scripts/tailwind/outlook-2027.input.css -o css/book.css --minify
module.exports = {
  content: ['./book.html'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0B0C10',
        coal: '#13151B',
        gold: '#D4AF37',
        champagne: '#F3D98B',
        ember: '#E06D53',
        ink: '#7F9BD1',
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
