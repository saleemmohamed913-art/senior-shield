/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'base': '1rem',     // 16px (body text minimum: 18px via line-height)
        'lg': '1.125rem',   // 18px (minimum body text)
        'xl': '1.25rem',    // 20px (important info)
        '2xl': '1.5rem',    // 24px (important info)
        '3xl': '1.875rem',  // 30px (headings)
        '4xl': '2.25rem',   // 36px (page headings)
        '5xl': '3rem',      // 48px (modal titles)
        '6xl': '3.75rem',   // 60px (SOS button)
      },
      lineHeight: {
        relaxed: '1.625',   // 1.6–1.7 range for readability
        '1.7': '1.7',       // 1.7 exactly
      },
      minHeight: {
        'screen': '100vh',
      },
      colors: {
        // Light background
        'bg-light': '#F8FAFC',
        'bg-lightest': '#FFFFFF',
        
        // Soft blue/teal primary
        'primary': {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Soft blue
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C3A66',
        },
        
        // Modern soft teal accent
        'accent': {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6', // Soft teal
          600: '#0D9488',
          700: '#0F766E',
        },
        
        // Clear red for SOS
        'danger': {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#FF3B30', // Clear red for SOS (iOS style)
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
        },
        
        // Success green
        'success': {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBFF7E',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        
        // Warning yellow
        'warning': {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        
        // High contrast utilities
        'high-contrast': {
          'bg': '#000000',
          'text': '#FFFFFF',
          'accent': '#FFFF00',
        }
      },
      boxShadow: {
        'soft': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 6px 12px rgba(0, 0, 0, 0.12)',
        'xl': '0 8px 16px rgba(0, 0, 0, 0.15)',
        'glow-blue': '0 0 20px rgba(14, 165, 233, 0.5)',
        'glow-red': '0 0 30px rgba(255, 59, 48, 0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  safelist: [
    'text-lg',
    'text-xl',
    'text-2xl',
    'text-3xl',
    'text-4xl',
    'text-5xl',
    'text-6xl',
    'p-5',
    'p-6',
    'p-8',
    'py-4',
    'px-4',
    'leading-relaxed',
    'leading-1.7',
    'rounded-2xl',
    'border-t-3',
    'bg-light',
    'animate-fade-in',
    'animate-slide-up',
    'animate-scale-in',
  ],
  plugins: [],
};
