<script lang="ts">
  import type { IndexState } from "./indexToggle";

  interface Props {
    state?: IndexState;
    onToggle: () => void;
  }

  let { state: propState = "allExpanded", onToggle }: Props = $props();
  let internalState = $state<IndexState | undefined>(undefined);

  export function setState(next: IndexState) {
    internalState = next;
  }

  let currentState = $derived(internalState ?? propState);

  let label = $derived(
    currentState === "allCollapsed" ? "すべて開く" : "すべて閉じる",
  );
</script>

<button
  type="button"
  class="btn btn-secondary btn-sm"
  onclick={onToggle}
>
  {label}
</button>
