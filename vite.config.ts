import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import AutoImport from "unplugin-auto-import/vite"

export default defineConfig({
  plugins: [
    AutoImport({
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.svelte$/   // .svelte (PENTING: ini yang membuat di aplikasi jalan)
      ],

      imports: [
        'svelte',
        'svelte/store',
        {
          '@tanstack/svelte-query': [
            'useQueryClient',
            'createQuery',
            'createMutation'
          ],

          '@tanstack/svelte-form': [
            'createForm'
          ]
        },
      ],

      defaultExportByFilename: false,

      dirs: [
        'src/lib/composables/**',
        'src/lib/utils/**',
      ],

      dts: './src/types/auto-imports.d.ts',

      viteOptimizeDeps: true,
      injectAtEnd: false, // Ubah ke false agar import diletakkan di atas
      eslintrc: {
        enabled: true, 
        filepath: './.eslintrc-auto-import.json', 
        globalsPropValue: true,
      },
    }),
    tailwindcss(),
    sveltekit()
  ]
});
