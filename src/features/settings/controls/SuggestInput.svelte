<script lang="ts">
  // 自由に書ける入力欄に、候補の一覧を添える。欄にフォーカスすると候補を開き、選ぶとその文字列が入る
  import { Combobox } from "bits-ui";
  import { Input } from "$lib/components/ui/input";

  interface Props {
    value: string;
    onChange: (next: string) => void;
    suggestions: readonly string[];
    placeholder?: string;
    "aria-label"?: string;
  }

  let { value, onChange, suggestions, placeholder, "aria-label": ariaLabel }: Props = $props();

  let open = $state(false);

  // 書いた文字を含む候補だけを残す。欄が空なら全部を出す
  let filtered = $derived.by(() => {
    const query = value.trim().toLowerCase();
    return suggestions.filter((name) => name.toLowerCase().includes(query));
  });
</script>

<Combobox.Root
  type="single"
  bind:open
  inputValue={value}
  value={suggestions.includes(value) ? value : ""}
  onValueChange={(next) => {
    if (next !== "") {
      onChange(next);
    }
  }}
>
  <Combobox.Input
    {placeholder}
    aria-label={ariaLabel}
    oninput={(e) => onChange(e.currentTarget.value)}
    onfocus={() => (open = true)}
  >
    {#snippet child({ props })}
      <Input {...props} />
    {/snippet}
  </Combobox.Input>
  {#if filtered.length > 0}
    <Combobox.Portal>
      <!-- 見た目は select-content と select-item に揃える -->
      <Combobox.Content
        sideOffset={4}
        align="start"
        class="relative z-50 max-h-[min(15rem,var(--bits-floating-available-height))] min-w-(--bits-floating-anchor-width) overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
      >
        {#each filtered as name (name)}
          <Combobox.Item
            value={name}
            label={name}
            class="relative flex w-full cursor-default items-center rounded-md px-1.5 py-1 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          >
            {name}
          </Combobox.Item>
        {/each}
      </Combobox.Content>
    </Combobox.Portal>
  {/if}
</Combobox.Root>
