<script lang="ts">
  // 関係する入力欄を、1つの枠の中に区切り線で積む。中の部品は枠と角丸を外して幅いっぱいに広げ、枠の側でフォーカスを示す
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";

  interface Props {
    children: Snippet; // 1行に1つずつ並べる。行は Input・ボタン・DatePicker・Select、またはそれらを含む要素
    class?: string;
  }

  let { children, class: className }: Props = $props();
</script>

<div
  role="group"
  class={cn(
    "flex min-w-0 flex-col divide-y divide-input overflow-hidden rounded-lg border border-input transition-colors dark:bg-input/30",
    "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
    "[&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:w-full [&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:rounded-none [&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:border-0 [&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:bg-transparent [&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:shadow-none [&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:focus-visible:ring-0 dark:[&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:bg-transparent [&_:is([data-slot=input],[data-slot=button],[data-slot=popover-trigger],[data-slot=select-trigger])]:text-sm",
    "[&_:is([data-slot=button],[data-slot=popover-trigger])]:justify-start",
    className,
  )}
>
  {@render children()}
</div>
