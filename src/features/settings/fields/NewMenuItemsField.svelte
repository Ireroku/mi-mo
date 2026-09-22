<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { NewMenuItem } from "@/features/menu/navbar/types";
  import ListField from "./ListField.svelte";
  import { Input } from "$lib/components/ui/input";
  import { Switch } from "$lib/components/ui/switch";
  import { Label } from "$lib/components/ui/label";

  let { value, onChange }: CustomFieldProps<NewMenuItem[] | undefined> = $props();

  let items = $derived(value ?? []);
</script>

<ListField
  {items}
  {onChange}
  createItem={(): NewMenuItem => ({ text: "", href: "", newTab: false })}
  addLabel="メニュー項目を追加"
>
  {#snippet row(item, update)}
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Input
        type="text"
        placeholder="表示名"
        value={item.text}
        class="flex-1"
        oninput={(e) => update({ ...item, text: (e.target as HTMLInputElement).value })}
      />
      <Input
        type="text"
        placeholder="URL"
        value={item.href}
        class="flex-2"
        oninput={(e) => update({ ...item, href: (e.target as HTMLInputElement).value })}
      />
      <div class="flex items-center gap-1.5 shrink-0">
        <Switch
          id="newtab-toggle"
          checked={item.newTab ?? false}
          onCheckedChange={(checked) => update({ ...item, newTab: checked })}
        />
        <span class="text-xs text-muted-foreground whitespace-nowrap">別タブ</span>
      </div>
    </div>
  {/snippet}
</ListField>
