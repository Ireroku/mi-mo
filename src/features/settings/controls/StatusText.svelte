<script lang="ts">
  // 操作の結果を知らせる1行の文。失敗の時だけ赤にする
  import type { ClassValue } from "svelte/elements";

  interface Props {
    text: string;
    failed?: boolean;
    class?: ClassValue; // 置き場所に合わせた余白
  }

  let { text, failed = false, class: className }: Props = $props();
</script>

<p
  class={[className, "text-note", failed ? "text-destructive" : "text-muted-foreground"]}
  role="status"
>
  {text}
</p>
