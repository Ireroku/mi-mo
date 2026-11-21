<script lang="ts">
  // 見出しと、区切り線で行を並べるカードの組。title を省くと見出しを出さない
  import type { Snippet } from "svelte";

  interface Props {
    title?: string;
    children: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<section>
  {#if title}
    <h2 class="mb-1.5 px-4 text-row font-semibold">{title}</h2>
  {/if}
  <div class="divide-y divide-border rounded-xl bg-card pl-4 text-card-foreground">
    {@render children()}
  </div>
</section>
