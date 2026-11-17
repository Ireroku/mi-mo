<script lang="ts">
  // 24時間表記の時刻を "HH:MM" で入れる。打って入れるか、時計のボタンから時と分（5分刻み）を選ぶ
  import * as InputGroup from "$lib/components/ui/input-group";
  import * as Popover from "$lib/components/ui/popover";
  import { cn } from "$lib/utils";
  import { Clock } from "@lucide/svelte";
  import { normalizeTime } from "./time.logic";

  interface Props {
    value: string; // "HH:MM"。未入力は ""
    onChange: (next: string) => void;
    label: string; // 読み上げ用の名前。画面には出さない
    class?: string;
  }

  let { value, onChange, label, class: className }: Props = $props();

  const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

  let open = $state(false);
  let [hour, minute] = $derived(value.split(":"));

  // 打った文字を "HH:MM" へ揃えて保存する。読めない文字は元の値へ戻す
  function commit(input: HTMLInputElement) {
    if (input.value.trim() === "") {
      input.value = value;
      return;
    }

    const normalized = normalizeTime(input.value);
    input.value = normalized ?? value;
    if (normalized && normalized !== value) {
      onChange(normalized);
    }
  }

  // 片方だけを選んだ場合、もう片方は今の値を残す。未入力なら 00 にする
  function pick(nextHour: string | undefined, nextMinute: string | undefined) {
    onChange(`${nextHour || "00"}:${nextMinute || "00"}`);
  }

  // 開いた時に、選ばれている値を列の真ん中へ寄せる
  function centerSelected(column: HTMLElement) {
    const selected = column.querySelector<HTMLElement>("[aria-pressed=true]");
    if (selected) {
      column.scrollTop =
        selected.offsetTop - column.clientHeight / 2 + selected.offsetHeight / 2;
    }
  }
</script>

{#snippet columnOf(options: string[], selected: string | undefined, onPick: (v: string) => void, name: string)}
  <div
    {@attach centerSelected}
    role="group"
    aria-label={name}
    class="relative flex h-52 w-12 flex-col gap-0.5 overflow-y-auto overscroll-contain p-0.5"
  >
    {#each options as option (option)}
      <button
        type="button"
        aria-pressed={option === selected}
        class={[
          "shrink-0 cursor-pointer rounded-md py-1 text-center text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          option === selected
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent hover:text-accent-foreground",
        ]}
        onclick={() => onPick(option)}
      >
        {option}
      </button>
    {/each}
  </div>
{/snippet}

<InputGroup.Root class={cn("w-24 shrink-0", className)}>
  <InputGroup.Input
    {value}
    aria-label={label}
    inputmode="numeric"
    autocomplete="off"
    placeholder="--:--"
    class="pr-0 text-sm tabular-nums"
    onblur={(e) => commit(e.currentTarget)}
    onkeydown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit(e.currentTarget);
      }
    }}
  />
  <InputGroup.Addon align="inline-end">
    <Popover.Root bind:open>
      <Popover.Trigger>
        {#snippet child({ props })}
          <InputGroup.Button {...props} size="icon-xs" aria-label={`${label}を選ぶ`}>
            <Clock />
          </InputGroup.Button>
        {/snippet}
      </Popover.Trigger>
      <Popover.Content
        align="end"
        class="w-auto flex-row gap-1 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {@render columnOf(HOURS, hour, (h) => pick(h, minute), "時")}
        <div class="w-px self-stretch bg-border"></div>
        {@render columnOf(MINUTES, minute, (m) => {
          pick(hour, m);
          open = false;
        }, "分")}
      </Popover.Content>
    </Popover.Root>
  </InputGroup.Addon>
</InputGroup.Root>
