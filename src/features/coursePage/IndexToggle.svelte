<script lang="ts">
  import type { IndexState } from "./indexToggle";
  import { Button } from "$lib/components/ui/button";
  import { ChevronsDownUp, ChevronsUpDown } from "@lucide/svelte";

  interface Props {
    state?: IndexState;
    onToggle: () => void;
  }

  let { state = "allExpanded", onToggle }: Props = $props();

  export function setState(next: IndexState) {
    state = next;
  }

  let label = $derived(
    state === "allCollapsed" ? "すべて開く" : "すべて閉じる",
  );
</script>

<Button
  variant="ghost"
  size="sm"
  class="font-sans text-muted-foreground"
  onclick={onToggle}
>
  {#if state === "allCollapsed"}
    <ChevronsUpDown />
  {:else}
    <ChevronsDownUp />
  {/if}
  {label}
</Button>
