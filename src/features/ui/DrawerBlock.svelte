<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    children: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<!-- 右のドロワーに mi-mo が足すブロックの外枠。Shadow DOM の中には Moodle の .card が届かないため、
     周りの Moodle のブロック（section.block.card）を測った値を直接書く。
     Tailwind の角丸などはテーマの変数から決まり Moodle の値とずれるため、寸法は px で書く -->
<section class="mb-[16px] rounded-[8px] border border-black/12.5 bg-white p-[16px]">
  <h5 class="mb-[12px] text-[16.8px] leading-tight font-bold text-foreground">{title}</h5>
  {@render children()}
</section>
