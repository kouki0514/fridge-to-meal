import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  // Source SVG used to generate all icon sizes
  images: ['public/pwa-icon.svg'],
  preset: {
    ...minimal2023Preset,
    // Apple touch icon: 180x180 PNG (required for iOS home screen)
    apple: {
      sizes: [180],
      padding: 0,
    },
  },
})
