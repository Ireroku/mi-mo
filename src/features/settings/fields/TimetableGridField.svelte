<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { TimetableSlot, Weekday } from "@/features/timetable/types";
  import { periodTableSetting } from "@/utils/settings";
  import type { PeriodSlot } from "@/utils/periods";
  import { Input } from "$lib/components/ui/input";
  import { ChevronDown, ChevronRight } from "@lucide/svelte";

  let {
    value,
    onChange,
  }: CustomFieldProps<Record<Weekday, (TimetableSlot | null)[]>> = $props();

  const WEEKDAYS: { key: Weekday; label: string }[] = [
    { key: "mon", label: "月曜日" },
    { key: "tue", label: "火曜日" },
    { key: "wed", label: "水曜日" },
    { key: "thu", label: "木曜日" },
    { key: "fri", label: "金曜日" },
  ];

  let periods = $state<PeriodSlot[]>([]);
  let openDays = $state<Record<Weekday, boolean>>({
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
  });

  $effect(() => {
    periodTableSetting.getValue().then((table) => {
      periods = table.periods;
    });
  });

  function toggleDay(w: Weekday) {
    openDays[w] = !openDays[w];
  }

  function handleSlotChange(
    w: Weekday,
    periodIdx: number,
    title: string,
    urlStr: string,
  ) {
    const list = [...(value[w] || [])];
    // 足りない分を null で埋める
    while (list.length <= periodIdx) {
      list.push(null);
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
      list[periodIdx] = null;
    } else {
      const trimmedUrl = urlStr.trim();
      list[periodIdx] = {
        title: trimmedTitle,
        url: trimmedUrl || undefined,
      };
    }

    onChange({
      ...value,
      [w]: list,
    });
  }

  let periodCount = $derived(Math.max(periods.length, 5));
</script>

<div class="flex flex-col gap-2 w-full">
  {#each WEEKDAYS as { key, label }}
    {@const isOpen = openDays[key]}
    {@const slots = value[key] || []}
    <div class="rounded-lg border bg-card text-card-foreground shadow-2xs overflow-hidden">
      <button
        type="button"
        class="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-accent/50 transition-colors"
        onclick={() => toggleDay(key)}
      >
        <span>{label}</span>
        {#if isOpen}
          <ChevronDown class="size-4 text-muted-foreground" />
        {:else}
          <ChevronRight class="size-4 text-muted-foreground" />
        {/if}
      </button>

      {#if isOpen}
        <div class="border-t px-3 py-2 flex flex-col gap-2.5 bg-background/50">
          {#each Array(periodCount) as _, idx}
            {@const slot = slots[idx]}
            {@const periodSlot = periods.find((p) => p.period === idx + 1)}
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span class="w-16 shrink-0 text-xs font-mono font-medium text-muted-foreground">
                {idx + 1}限{#if periodSlot} ({periodSlot.start}){/if}
              </span>
              <Input
                type="text"
                placeholder="科目名"
                value={slot?.title ?? ""}
                class="flex-1 text-xs"
                oninput={(e) =>
                  handleSlotChange(
                    key,
                    idx,
                    (e.target as HTMLInputElement).value,
                    slot?.url ?? "",
                  )}
              />
              <Input
                type="text"
                placeholder="リンク先URL（任意）"
                value={slot?.url ?? ""}
                class="flex-1 text-xs"
                oninput={(e) =>
                  handleSlotChange(
                    key,
                    idx,
                    slot?.title ?? "",
                    (e.target as HTMLInputElement).value,
                  )}
              />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>
