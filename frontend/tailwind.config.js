/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 使用 CSS 变量定义颜色
        primary: {
          DEFAULT: 'var(--primary-color)',
          hover: 'var(--primary-hover)',
          active: 'var(--primary-active)',
        },
        secondary: {
          dark: 'var(--secondary-dark)',
          darkHover: 'var(--secondary-dark-hover)',
          light: 'var(--secondary-light)',
          lightHover: 'var(--secondary-light-hover)',
        },
        gray: {
          blue: 'var(--gray-blue)',
          blueLight: 'var(--gray-blue-light)',
          blueDark: 'var(--gray-blue-dark)',
        },
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          dark: 'var(--bg-dark)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          placeholder: 'var(--text-placeholder)',
          inverse: 'var(--text-inverse)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          dark: 'var(--border-color-dark)',
        },
        success: 'var(--success-color)',
        warning: 'var(--warning-color)',
        error: 'var(--error-color)',
        info: 'var(--info-color)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        primary: 'var(--shadow-primary)',
      },
    },
  },
  plugins: [],
}