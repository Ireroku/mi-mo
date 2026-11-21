<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { NewMenuItem } from "@/features/menu/navbar/types";
  import ListField from "./ListField.svelte";
  import StackedInputs from "../controls/StackedInputs.svelte";
  import { Input } from "$lib/components/ui/input";
  import { Switch } from "$lib/components/ui/switch";
  import { Label } from "$lib/components/ui/label";

  let { value, onChange }: CustomFieldProps<NewMenuItem[] | undefined> = $props();

  // 行ごとのスイッチの id の頭。行の位置を足して、ページの中で重ならない id にする
  const uid = $props.id();

  let items = $derived(value ?? []);
</script>

<ListField
  {items}
  {onChange}
  createItem={(): NewMenuItem => ({ text: "", href: "", newTab: false })}
  addLabel="メニュー項目を追加"
  sortable={{ listLabel: "追加する項目の並び", itemLabel: (item) => item.text || "名前のない項目" }}
>
  {#snippet row(item, update, index)}
    {@const toggleId = `${uid}-newtab-${index}`}
    <div class="flex flex-col gap-1.5">
      <StackedInputs>
        <Input
          type="text"
          aria-label="表示名"
          placeholder="表示名"
          value={item.text}
          oninput={(e) => update({ ...item, text: e.currentTarget.value })}
        />
        <Input
          type="text"
          aria-label="URL"
          placeholder="URL"
          value={item.href}
          oninput={(e) => update({ ...item, href: e.currentTarget.value })}
        />
      </StackedInputs>
      <div class="flex items-center gap-2">
        <Switch
          id={toggleId}
          size="sm"
          checked={item.newTab ?? false}
          onCheckedChange={(checked) => update({ ...item, newTab: checked })}
        />
        <Label for={toggleId} class="cursor-pointer text-note font-normal text-muted-foreground">
          別タブで開く
        </Label>
      </div>
    </div>
  {/snippet}
</ListField>
