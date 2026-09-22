<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import ListField from "./ListField.svelte";
  import { Input } from "$lib/components/ui/input";

  let { value, onChange }: CustomFieldProps<string[]> = $props();

  let items = $derived(value ?? []);
</script>

<ListField
  {items}
  {onChange}
  createItem={() => ""}
  addLabel="挨拶メッセージを追加"
>
  {#snippet row(item, update)}
    <Input
      type="text"
      placeholder="メッセージ内容"
      value={item}
      oninput={(e) => update((e.target as HTMLInputElement).value)}
    />
  {/snippet}
</ListField>
