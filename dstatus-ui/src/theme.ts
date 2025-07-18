import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#eff6ff' },
          100: { value: '#dbeafe' },
          200: { value: '#bfdbfe' },
          300: { value: '#93c5fd' },
          400: { value: '#60a5fa' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
          700: { value: '#1d4ed8' },
          800: { value: '#1e40af' },
          900: { value: '#1e3a8a' },
        },
        gray: {
          50: { value: '#f8fafc' },
          100: { value: '#f1f5f9' },
          200: { value: '#e2e8f0' },
          300: { value: '#cbd5e1' },
          400: { value: '#94a3b8' },
          500: { value: '#64748b' },
          600: { value: '#475569' },
          700: { value: '#334155' },
          800: { value: '#1e293b' },
          900: { value: '#0f172a' },
        },
        success: {
          50: { value: '#f0fdf4' },
          100: { value: '#dcfce7' },
          200: { value: '#bbf7d0' },
          300: { value: '#86efac' },
          400: { value: '#4ade80' },
          500: { value: '#22c55e' },
          600: { value: '#16a34a' },
          700: { value: '#15803d' },
          800: { value: '#166534' },
          900: { value: '#14532d' },
        },
        error: {
          50: { value: '#fef2f2' },
          100: { value: '#fee2e2' },
          200: { value: '#fecaca' },
          300: { value: '#fca5a5' },
          400: { value: '#f87171' },
          500: { value: '#ef4444' },
          600: { value: '#dc2626' },
          700: { value: '#b91c1c' },
          800: { value: '#991b1b' },
          900: { value: '#7f1d1d' },
        },
        warning: {
          50: { value: '#fffbeb' },
          100: { value: '#fef3c7' },
          200: { value: '#fde68a' },
          300: { value: '#fcd34d' },
          400: { value: '#fbbf24' },
          500: { value: '#f59e0b' },
          600: { value: '#d97706' },
          700: { value: '#b45309' },
          800: { value: '#92400e' },
          900: { value: '#78350f' },
        },
      },
      fonts: {
        heading: { value: '-apple-system, SF Pro Display, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
        body: { value: '-apple-system, SF Pro Text, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif' },
        mono: { value: 'SF Mono, Monaco, Inconsolata, Roboto Mono, monospace' },
      },
      fontSizes: {
        xs: { value: '11px' },
        sm: { value: '13px' },
        md: { value: '15px' },
        lg: { value: '17px' },
        xl: { value: '19px' },
        '2xl': { value: '24px' },
        '3xl': { value: '28px' },
        '4xl': { value: '34px' },
        '5xl': { value: '48px' },
        '6xl': { value: '60px' },
      },
      radii: {
        sm: { value: '2px' },
        base: { value: '4px' },
        md: { value: '6px' },
        lg: { value: '8px' },
        xl: { value: '12px' },
        '2xl': { value: '16px' },
        '3xl': { value: '24px' },
        full: { value: '9999px' },
      },
      shadows: {
        sm: { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
        base: { value: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
        md: { value: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
        lg: { value: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
        xl: { value: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
        '2xl': { value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: { _light: '{colors.white}', _dark: '{colors.gray.950}' } },
          subtle: { value: { _light: '{colors.gray.50}', _dark: '{colors.gray.900}' } },
          muted: { value: { _light: '{colors.gray.100}', _dark: '{colors.gray.800}' } },
        },
        fg: {
          DEFAULT: { value: { _light: '{colors.gray.900}', _dark: '{colors.gray.100}' } },
          muted: { value: { _light: '{colors.gray.600}', _dark: '{colors.gray.400}' } },
        },
        border: {
          DEFAULT: { value: { _light: '{colors.gray.200}', _dark: '{colors.gray.700}' } },
          subtle: { value: { _light: '{colors.gray.100}', _dark: '{colors.gray.800}' } },
        },
        brand: {
          solid: { value: '{colors.brand.500}' },
          contrast: { value: '{colors.white}' },
          fg: { value: '{colors.brand.700}' },
          muted: { value: '{colors.brand.100}' },
          subtle: { value: '{colors.brand.50}' },
          emphasized: { value: '{colors.brand.600}' },
          focusRing: { value: '{colors.brand.500}' },
        },
      },
    },
  },
  globalCss: {
    'html, body': {
      fontFamily: 'body',
      bg: 'bg',
      color: 'fg',
      lineHeight: 'base',
      fontFeatureSettings: '"kern" 1',
      textRendering: 'optimizeLegibility',
    },
    '*::placeholder': {
      color: 'fg.muted',
    },
    '*, *::before, &::after': {
      borderColor: 'border',
      wordWrap: 'break-word',
    },
    '::-webkit-scrollbar': {
      width: '6px',
    },
    '::-webkit-scrollbar-track': {
      bg: 'transparent',
    },
    '::-webkit-scrollbar-thumb': {
      bg: 'gray.300',
      borderRadius: '3px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: 'gray.400',
    },
  },
});

export const macOSSystem = createSystem(defaultConfig, config);
