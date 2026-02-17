<script lang="ts">
  import * as LucideIcons from 'lucide-svelte'
  import type { ComponentType, SvelteComponent } from 'svelte'

  interface Props {
    name: keyof typeof LucideIcons
    size?: number | string
    color?: string
    strokeWidth?: number | string
    class?: string
    absoluteStrokeWidth?: boolean
  }

  let {
    name,
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    class: className = '',
    absoluteStrokeWidth = false,
    ...restProps
  }: Props = $props()

  // Fix: Cast to ComponentType properly
  const Icon = $derived(
    LucideIcons[name] as unknown as ComponentType<SvelteComponent>
  )
</script>

<Icon
  {size}
  {color}
  {strokeWidth}
  {absoluteStrokeWidth}
  class={className}
  {...restProps}
/>
