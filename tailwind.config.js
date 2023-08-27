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
  ],
}
