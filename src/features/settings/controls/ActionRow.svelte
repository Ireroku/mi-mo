<script lang="ts">
  // カードの中で横いっぱいに広がる、押すと操作を始める行。
  // 色で押せることを示し、範囲の大きい破壊的な操作だけ赤にする
  import type { Component } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends Omit<HTMLButtonAttributes, "children"> {
    label: string;
    icon?: Component<{ class?: string }>;
    danger?: boolean;
  }

  let { label, icon: Icon, danger = false, ...rest }: Props = $props();
</script>

<button
  type="button"
  class={[
    "flex min-h-12 w-full cursor-pointer items-center gap-2 py-3 pr-4 text-left text-row transition-opacity active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    danger ? "text-destructive" : "text-primary",
  ]}
  {...rest}
>
  {#if Icon}
    <Icon class="size-4 shrink-0" />
  {/if}
  {label}
</button>
