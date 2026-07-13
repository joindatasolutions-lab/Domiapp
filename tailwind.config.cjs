module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8A3252',
          dark: '#6F2842'
        },
        ink: '#17151A',
        muted: '#6F6872',
        surface: '#F4F1F3',
        app: '#F8F6F7'
      },
      boxShadow: {
        soft: '0 14px 40px rgba(23, 21, 26, 0.08)',
        button: '0 14px 28px rgba(138, 50, 82, 0.28)',
        nav: '0 -14px 40px rgba(23, 21, 26, 0.12)'
      }
    }
  },
  plugins: []
}
