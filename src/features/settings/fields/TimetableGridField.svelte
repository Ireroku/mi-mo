<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import {
    WEEKDAYS,
    WEEKDAY_LABELS,
    type TimetableSlot,
    type Weekday,
  } from "@/features/timetable/types";
  import { periodTableSetting } from "@/utils/settings";
  import { periodName, type PeriodSlot } from "@/utils/periods";
  import * as Accordion from "$lib/components/ui/accordion";
  import { Input } from "$lib/components/ui/input";
  import StackedInputs from "../controls/StackedInputs.svelte";

  let {
    value,
    onChange,
  }: CustomFieldProps<Record<Weekday, (TimetableSlot | null)[]>> = $props();

  // 時限表の並びで行を出す。時限表は別の画面で直すため、開いた時に一度だけ読む
  let periods = $state<PeriodSlot[]>([]);

  $effect(() => {
    periodTableSetting.getValue().then((table) => {
      periods = table.periods;
    });
  });

  interface SlotInput {
    title: string;
    url: string;
  }

  function normalizeSlot({ title, url }: SlotInput): TimetableSlot | null {
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") {
      return null;
    }

    return {
      title: trimmedTitle,
      url: url.trim() || undefined,
    };
  }

  // 授業は時限の番号（period - 1）の位置に置く。時限表の並べ替えで授業が入れ替わらないようにするため
  function handleSlotChange(weekday: Weekday, periodIndex: number, input: SlotInput) {
    const list = [...(value[weekday] || [])];
    // 足りない分を null で埋める
    while (list.length <= periodIndex) {
      list.push(null);
    }

    list[periodIndex] = normalizeSlot(input);

    onChange({
      ...value,
      [weekday]: list,
    });
  }
</script>

<Accordion.Root type="single" class="w-full">
  {#each WEEKDAYS as key (key)}
    {@const label = `${WEEKDAY_LABELS[key]}曜日`}
    {@const slots = value[key] || []}
    <Accordion.Item value={key}>
      <Accordion.Trigger class="text-row font-normal">{label}</Accordion.Trigger>
      <Accordion.Content class="flex flex-col gap-3">
        {#each periods as periodSlot (periodSlot.period)}
          {@const index = periodSlot.period - 1}
          {@const slot = slots[index]}
          {@const heading = `${periodName(periodSlot)}（${periodSlot.start}）`}
          <div class="flex flex-col gap-1">
            <span class="whitespace-nowrap text-note font-normal text-muted-foreground">
              {heading}
            </span>
            <StackedInputs>
              <Input
                type="text"
                placeholder="科目名"
                aria-label={`${label} ${heading}の科目名`}
                value={slot?.title ?? ""}
                oninput={(e) =>
                  handleSlotChange(key, index, {
                    title: e.currentTarget.value,
                    url: slot?.url ?? "",
                  })}
              />
              <Input
                type="text"
                inputmode="url"
                placeholder="リンク先URL（任意）"
                aria-label={`${label} ${heading}のリンク先URL`}
                value={slot?.url ?? ""}
                oninput={(e) =>
                  handleSlotChange(key, index, {
                    title: slot?.title ?? "",
                    url: e.currentTarget.value,
                  })}
              />
            </StackedInputs>
          </div>
        {/each}
      </Accordion.Content>
    </Accordion.Item>
  {/each}
</Accordion.Root>
