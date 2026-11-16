<script lang="ts">
  import type { IndexState } from "./indexToggle";
  import { Button } from "$lib/components/ui/button";

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

<Button variant="outline" size="sm" class="font-sans" onclick={onToggle}>
  {label}
</Button>
