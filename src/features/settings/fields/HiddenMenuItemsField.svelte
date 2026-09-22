<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import ListField from "./ListField.svelte";
  import { Input } from "$lib/components/ui/input";

  let { value, onChange }: CustomFieldProps<string[] | undefined> = $props();

  let items = $derived(value ?? []);
</script>

<ListField
  {items}
  {onChange}
  createItem={() => ""}
  addLabel="隠す項目を追加"
>
  {#snippet row(item, update)}
    <Input
      type="text"
      placeholder="メニュー項目名"
      value={item}
      oninput={(e) => update((e.target as HTMLInputElement).value)}
    />
  {/snippet}
</ListField>
