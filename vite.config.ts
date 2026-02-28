import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-svelte-components/vite"

export default defineConfig({
  plugins: [
    Components({
      dirs: [
        'src/lib/components/ui',
        'src/lib/components/utils'
      ],

      extensions: ['svelte'],
      deep: true,
      dts: 'src/types/components-imports.d.ts',
      directoryAsNamespace: false,
      globalNamespaces: [],
      importPathTransform: v => v,
      allowOverrides: false,
      preprocess: null,
      include: [/\.svelte$/, /\.svelte\?svelte/],
      // EXCLUDE multi-part components from Svelte Components plugin
      // because we will handle them as Namespaces in AutoImport
      exclude: [
        /[\\/]node_modules[\\/]/,
        /[\\/]\.git[\\/]/,
        /[\\/]\.svelte-kit[\\/]/,
        /[\\/]ui[\\/](card|popover|command|dialog|dropdown-menu|select|sheet|table|tabs|tooltip|collapsible)[\\/]/
      ],
      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-components.json',
        globalsPropValue: true,
      }
    }),
    AutoImport({
      include: [
        /\.[tj]sx?$/,
        /\.svelte$/
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
          ],
          // MANUAL NAMESPACE MAPPING
          '$lib/utils': ['cn'],
          '$lib/components/ui/button': [
            'buttonVariants'
          ],
          '$lib/components/ui/card': [['*', 'Card']],
          '$lib/components/ui/popover': [['*', 'Popover']],
          '$lib/components/ui/command': [['*', 'Command']],
          '$lib/components/ui/dialog': [['*', 'Dialog']],
          '$lib/components/ui/dropdown-menu': [['*', 'DropdownMenu']],
          '$lib/components/ui/select': [['*', 'Select']],
          '$lib/components/ui/sheet': [['*', 'Sheet']],
          '$lib/components/ui/table': [['*', 'Table']],
          '$lib/components/ui/tabs': [['*', 'Tabs']],
          '$lib/components/ui/tooltip': [['*', 'Tooltip']],
          '$lib/components/ui/collapsible': [['*', 'Collapsible']]
        },
      ],

      defaultExportByFilename: false,

      dirs: [
        'src/lib/composables/**',
        'src/lib/utils/**',
        'src/lib/@types/**',
        'src/lib/auth',
        'src/lib/@functions'
      ],

      dts: './src/types/auto-imports.d.ts',

      viteOptimizeDeps: true,
      injectAtEnd: false,
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
