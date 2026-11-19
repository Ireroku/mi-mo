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
     Tailwind の角丸などはテーマの変数から決まり Moodle の値とずれるため、寸法は px で書く。
     見出しの文字は Moodle の見出しと同じく rem で書き、ブラウザの文字の大きさの設定に合わせて変わるようにする -->
<section class="mb-[16px] rounded-[8px] border border-black/12.5 bg-white p-[16px]">
  <h5 class="mb-[12px] text-[1.05rem] leading-tight font-bold text-foreground">{title}</h5>
  {@render children()}
</section>
