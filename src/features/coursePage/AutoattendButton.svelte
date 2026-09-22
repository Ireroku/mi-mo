<script lang="ts">
  import type { AutoattendButtonPlacement } from "./autoattendButton";
  import { Button } from "$lib/components/ui/button";

  interface Props {
    href: string;
    placement: AutoattendButtonPlacement;
  }

  let { href, placement }: Props = $props();
</script>

{#if placement === "floating"}
  <div class="fixed bottom-20 right-6 z-50 shadow-lg">
    <Button {href} size="lg" class="shadow-md">
      出欠確認
    </Button>
  </div>
{:else}
  <div class="mb-4">
    <Button {href}>
      出欠確認
    </Button>
  </div>
{/if}
