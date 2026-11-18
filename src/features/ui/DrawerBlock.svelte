<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    children: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<!-- 右のドロワーに mi-mo が足すブロックの外枠。周りの Moodle のブロック（section.block.card）に余白と見出しを合わせる -->
<section class="card mb-3 block">
  <div class="card-body p-3">
    <h5 class="card-title h6 mb-2 font-bold text-foreground">{title}</h5>
    {@render children()}
  </div>
</section>
