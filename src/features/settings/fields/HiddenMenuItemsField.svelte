<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import ListField from "./ListField.svelte";
  import SuggestInput from "../controls/SuggestInput.svelte";
  import { menuItemsCacheSetting } from "@/utils/settings";

  let { value, onChange }: CustomFieldProps<string[] | undefined> = $props();

  let items = $derived(value ?? []);

  // Moodle を開いたときに控えた項目名。まだ一度も開いていなければ空で、そのときは自由に書くだけになる
  let knownNames = $state<string[]>([]);

  $effect(() => {
    menuItemsCacheSetting.getValue().then((cache) => {
      knownNames = cache.names;
    });
  });

  // 他の行で隠すと決めた名前は候補から外す。その行の名前は残し、選んだ状態として見せる
  function suggestionsFor(item: string): string[] {
    return knownNames.filter((name) => name === item || !items.includes(name));
  }
</script>

<ListField
  {items}
  {onChange}
  createItem={() => ""}
  addLabel="隠す項目を追加"
  sortable={{ listLabel: "隠す項目の並び", itemLabel: (item) => item || "名前のない項目" }}
>
  {#snippet row(item, update)}
    <SuggestInput
      value={item}
      onChange={update}
      suggestions={suggestionsFor(item)}
      placeholder="メニュー項目名"
      aria-label="隠すメニュー項目"
    />
  {/snippet}
</ListField>
