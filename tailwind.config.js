let { fontFamily } = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      aspectRatio: {
        a4: '210 / 297',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        hand: ['var(--font-shadows-into-light)'],
        pdf: ['Arial'],
      },
    },
  },
  plugins: [
    require('@headlessui/tailwindcss'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),

    function ({ addVariant }) {
      addVariant('classified', 'html[data-classified] &')
    },

    function ({ addVariant }) {
      addVariant('first-page', ['&[data-first-page]', '[data-first-page] &'])
      addVariant('even-page', ['&[data-even-page]', '[data-even-page] &'])
      addVariant('odd-page', ['&[data-odd-page]', '[data-odd-page] &'])
      addVariant('last-page', ['&[data-last-page]', '[data-last-page] &'])
      addVariant('single-page', ['&[data-single-page]', '[data-single-page] &'])
    },
  ],
}
