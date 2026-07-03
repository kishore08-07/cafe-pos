/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        gold: '#00754A',
        'gold-pale': '#D4E9E2',
        'gold-deep': '#006241',
        paid: '#00754A',
        cancel: '#C82014',
        'card-pay': '#2B5148',
      },
      fontFamily: {
        display: ['Lora', 'Georgia', 'serif'],
        body: ['Inter', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        hair: '12px',
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};
