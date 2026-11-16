<script lang="ts" generics="T">
  import type { Snippet } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { Trash2, Plus } from "@lucide/svelte";

  interface Props {
    items: readonly T[];
    onChange: (next: T[]) => void;
    createItem: () => T;
    addLabel: string;
    row: Snippet<[T, (next: T) => void]>;
  }

  let { items, onChange, createItem, addLabel, row }: Props = $props();

  function handleUpdate(index: number, nextItem: T) {
    const next = [...items];
    next[index] = nextItem;
    onChange(next);
  }

  function handleRemove(index: number) {
    const next = items.filter((_, i) => i !== index);
    onChange(next);
  }

  function handleAdd() {
    onChange([...items, createItem()]);
  }
</script>

<div class="flex flex-col gap-2 w-full">
  {#if items.length > 0}
    <div class="flex flex-col gap-2">
      {#each items as item, index}
        <div class="flex items-center gap-2">
          <div class="flex-1 min-w-0">
            {@render row(item, (nextItem) => handleUpdate(index, nextItem))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground hover:text-destructive shrink-0"
            onclick={() => handleRemove(index)}
            aria-label="削除"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
      {/each}
    </div>
  {/if}

  <div>
    <Button
      type="button"
      variant="outline"
      size="sm"
      class="gap-1"
      onclick={handleAdd}
    >
      <Plus class="size-3.5" />
      {addLabel}
    </Button>
  </div>
</div>
