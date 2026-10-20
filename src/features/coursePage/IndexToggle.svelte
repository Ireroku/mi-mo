<script lang="ts">
  import type { IndexState } from "./indexToggle";

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

<button
  type="button"
  class="btn btn-secondary btn-sm"
  onclick={onToggle}
>
  {label}
</button>
