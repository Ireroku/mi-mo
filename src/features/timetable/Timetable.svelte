<script lang="ts">
  import type { PeriodSlot } from "@/utils/periods";
  import type { TimetableConfig, Weekday } from "./types";
  import {
    lessonsOn,
    type LessonOccurrence,
  } from "./schedule.logic";

  interface Props {
    config: TimetableConfig;
    periods: PeriodSlot[];
    schedule: LessonOccurrence[];
  }

  let { config, periods, schedule }: Props = $props();

  const WEEKDAY_NAMES: { key: Weekday; label: string }[] = [
    { key: "mon", label: "月" },
    { key: "tue", label: "火" },
    { key: "wed", label: "水" },
    { key: "thu", label: "木" },
    { key: "fri", label: "金" },
  ];

  // 今週の月曜〜金曜の日付を計算
  function getThisWeekDays(): Date[] {
    const now = new Date();
    const currentDay = now.getDay(); // 0(日) - 6(土)
    // 月曜へのオフセット: 日(0)なら-6, 月(1)なら0, 火(2)なら-1, ..., 土(6)なら-5
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }

  let weekDays = $derived(getThisWeekDays());

  function isSameDay(d1: Date, d2: Date): boolean {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function formatDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  const today = new Date();

  // 各曜日のレッスンを取得
  function getLessonsForDay(date: Date): Map<number, LessonOccurrence> {
    const list = lessonsOn(date, schedule);
    const map = new Map<number, LessonOccurrence>();
    for (const occ of list) {
      map.set(occ.periodIndex, occ);
    }
    return map;
  }

  let weekLessons = $derived(weekDays.map((d) => getLessonsForDay(d)));

  // その日が休講日かどうか
  function isHoliday(date: Date): boolean {
    const key = formatDateKey(date);
    return config.holidays.some((h) => h.date === key);
  }

  let maxPeriods = $derived(
    Math.max(
      periods.length,
      ...Object.values(config.grid).map((list) => list.length),
      5,
    ),
  );
</script>

<div
  class="mimo-timetable-panel my-4 overflow-hidden rounded-xl border font-sans shadow-xs transition-colors"
  data-mimo-color={config.color}
>
  <div class="border-b px-4 py-3 flex items-center justify-between">
    <h3 class="text-sm font-semibold tracking-tight">今週の時間割</h3>
    <span class="text-xs opacity-75">
      {weekDays[0]?.getMonth()! + 1}月{weekDays[0]?.getDate()}日 〜
      {weekDays[4]?.getMonth()! + 1}月{weekDays[4]?.getDate()}日
    </span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-left text-xs">
      <thead>
        <tr class="border-b">
          <th class="w-16 p-2 text-center font-medium opacity-75">時限</th>
          {#each weekDays as day, i}
            {@const isToday = isSameDay(day, today)}
            {@const holiday = isHoliday(day)}
            <th
              class="min-w-28 p-2 text-center font-medium transition-colors"
              class:is-today={isToday}
            >
              <div class="flex flex-col items-center gap-0.5">
                <span class="text-sm font-semibold">
                  {WEEKDAY_NAMES[i]?.label}
                </span>
                <span class="text-[10px] opacity-75">
                  {day.getMonth() + 1}/{day.getDate()}
                </span>
                {#if holiday}
                  <span class="rounded px-1.5 py-0.2 text-[10px] font-normal bg-destructive/15 text-destructive">
                    休講
                  </span>
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each Array(maxPeriods) as _, periodIdx}
          {@const periodSlot = periods.find((p) => p.period === periodIdx + 1)}
          <tr class="border-b last:border-b-0">
            <td class="p-2 text-center font-mono opacity-75 border-r">
              <div class="font-semibold">{periodIdx + 1}限</div>
              {#if periodSlot}
                <div class="text-[9px] opacity-70 leading-tight mt-0.5">
                  {periodSlot.start}<br />{periodSlot.end}
                </div>
              {/if}
            </td>
            {#each weekDays as day, dayIdx}
              {@const isToday = isSameDay(day, today)}
              {@const dayMap = weekLessons[dayIdx]}
              {@const occ = dayMap?.get(periodIdx)}
              <td
                class="p-2 align-top border-r last:border-r-0 transition-colors"
                class:is-today={isToday}
              >
                {#if occ}
                  <div class="flex flex-col gap-1">
                    {#if occ.slot.url}
                      <a
                        href={occ.slot.url}
                        class="font-medium hover:underline text-foreground leading-snug break-words"
                      >
                        {occ.slot.title}
                      </a>
                    {:else}
                      <span class="font-medium text-foreground leading-snug break-words">
                        {occ.slot.title}
                      </span>
                    {/if}
                    <span class="text-[10px] opacity-60">
                      第{occ.count}回
                    </span>
                  </div>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  /* テーマ・配色スタイル */
  .mimo-timetable-panel[data-mimo-color="white"] {
    background-color: #ffffff;
    color: #0f172a;
    border-color: #e2e8f0;
  }
  .mimo-timetable-panel[data-mimo-color="white"] thead tr,
  .mimo-timetable-panel[data-mimo-color="white"] tbody tr,
  .mimo-timetable-panel[data-mimo-color="white"] td,
  .mimo-timetable-panel[data-mimo-color="white"] th {
    border-color: #f1f5f9;
  }
  .mimo-timetable-panel[data-mimo-color="white"] .is-today {
    background-color: #f8fafc;
  }

  .mimo-timetable-panel[data-mimo-color="black"] {
    background-color: #09090b;
    color: #f4f4f5;
    border-color: #27272a;
  }
  .mimo-timetable-panel[data-mimo-color="black"] thead tr,
  .mimo-timetable-panel[data-mimo-color="black"] tbody tr,
  .mimo-timetable-panel[data-mimo-color="black"] td,
  .mimo-timetable-panel[data-mimo-color="black"] th {
    border-color: #18181b;
  }
  .mimo-timetable-panel[data-mimo-color="black"] .is-today {
    background-color: #18181b;
  }

  .mimo-timetable-panel[data-mimo-color="sky"] {
    background-color: #f0f9ff;
    color: #0c4a6e;
    border-color: #bae6fd;
  }
  .mimo-timetable-panel[data-mimo-color="sky"] thead tr,
  .mimo-timetable-panel[data-mimo-color="sky"] tbody tr,
  .mimo-timetable-panel[data-mimo-color="sky"] td,
  .mimo-timetable-panel[data-mimo-color="sky"] th {
    border-color: #e0f2fe;
  }
  .mimo-timetable-panel[data-mimo-color="sky"] .is-today {
    background-color: #e0f2fe;
  }

  .mimo-timetable-panel[data-mimo-color="pink"] {
    background-color: #fdf2f8;
    color: #831843;
    border-color: #fbcfe8;
  }
  .mimo-timetable-panel[data-mimo-color="pink"] thead tr,
  .mimo-timetable-panel[data-mimo-color="pink"] tbody tr,
  .mimo-timetable-panel[data-mimo-color="pink"] td,
  .mimo-timetable-panel[data-mimo-color="pink"] th {
    border-color: #fce7f3;
  }
  .mimo-timetable-panel[data-mimo-color="pink"] .is-today {
    background-color: #fce7f3;
  }

  .mimo-timetable-panel[data-mimo-color="green"] {
    background-color: #f0fdf4;
    color: #14532d;
    border-color: #bbf7d0;
  }
  .mimo-timetable-panel[data-mimo-color="green"] thead tr,
  .mimo-timetable-panel[data-mimo-color="green"] tbody tr,
  .mimo-timetable-panel[data-mimo-color="green"] td,
  .mimo-timetable-panel[data-mimo-color="green"] th {
    border-color: #dcfce7;
  }
  .mimo-timetable-panel[data-mimo-color="green"] .is-today {
    background-color: #dcfce7;
  }

  /* ダークモード対応 */
  @media (prefers-color-scheme: dark) {
    .mimo-timetable-panel[data-mimo-color="white"] {
      background-color: #18181b;
      color: #f4f4f5;
      border-color: #27272a;
    }
    .mimo-timetable-panel[data-mimo-color="white"] thead tr,
    .mimo-timetable-panel[data-mimo-color="white"] tbody tr,
    .mimo-timetable-panel[data-mimo-color="white"] td,
    .mimo-timetable-panel[data-mimo-color="white"] th {
      border-color: #27272a;
    }
    .mimo-timetable-panel[data-mimo-color="white"] .is-today {
      background-color: #27272a;
    }

    .mimo-timetable-panel[data-mimo-color="sky"] {
      background-color: #082f49;
      color: #e0f2fe;
      border-color: #0369a1;
    }
    .mimo-timetable-panel[data-mimo-color="sky"] thead tr,
    .mimo-timetable-panel[data-mimo-color="sky"] tbody tr,
    .mimo-timetable-panel[data-mimo-color="sky"] td,
    .mimo-timetable-panel[data-mimo-color="sky"] th {
      border-color: #0c4a6e;
    }
    .mimo-timetable-panel[data-mimo-color="sky"] .is-today {
      background-color: #0c4a6e;
    }

    .mimo-timetable-panel[data-mimo-color="pink"] {
      background-color: #500724;
      color: #fce7f3;
      border-color: #9d174d;
    }
    .mimo-timetable-panel[data-mimo-color="pink"] thead tr,
    .mimo-timetable-panel[data-mimo-color="pink"] tbody tr,
    .mimo-timetable-panel[data-mimo-color="pink"] td,
    .mimo-timetable-panel[data-mimo-color="pink"] th {
      border-color: #700a32;
    }
    .mimo-timetable-panel[data-mimo-color="pink"] .is-today {
      background-color: #700a32;
    }

    .mimo-timetable-panel[data-mimo-color="green"] {
      background-color: #052e16;
      color: #dcfce7;
      border-color: #15803d;
    }
    .mimo-timetable-panel[data-mimo-color="green"] thead tr,
    .mimo-timetable-panel[data-mimo-color="green"] tbody tr,
    .mimo-timetable-panel[data-mimo-color="green"] td,
    .mimo-timetable-panel[data-mimo-color="green"] th {
      border-color: #14532d;
    }
    .mimo-timetable-panel[data-mimo-color="green"] .is-today {
      background-color: #14532d;
    }
  }
</style>
