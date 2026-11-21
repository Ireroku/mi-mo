<script lang="ts">
  import { periodName, type PeriodSlot } from "@/utils/periods";
  import { WEEKDAYS, WEEKDAY_LABELS, type TimetableConfig } from "./types";
  import { formatDateKey, isSameDay } from "./date";
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

  // 開いた時点の週を出す。開いたまま日をまたいでも描き直さない
  const weekDays = getThisWeekDays();

  // 今日の列の添字。土日は今週の5日に入らず -1 になる
  const today = new Date();
  const todayIndex = weekDays.findIndex((day) => isSameDay(day, today));

  // 各曜日のレッスンを取得
  function getLessonsForDay(date: Date): Map<number, LessonOccurrence> {
    return new Map(lessonsOn(date, schedule).map((occ) => [occ.periodIndex, occ]));
  }

  let weekLessons = $derived(weekDays.map((d) => getLessonsForDay(d)));

  // その日が休講日かどうか
  function isHoliday(date: Date): boolean {
    const key = formatDateKey(date);
    return config.holidays.some((h) => h.date === key);
  }

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
    <table class="w-full border-collapse text-left">
      <thead>
        <tr class="border-b">
          <th class="w-16 p-2 text-center text-xs font-medium opacity-75">時限</th>
          {#each weekDays as day, i}
            {@const holiday = isHoliday(day)}
            <th
              class="min-w-28 p-2 text-center font-medium transition-colors"
              class:is-today={i === todayIndex}
            >
              <div class="flex flex-col items-center gap-0.5">
                <span class="text-sm font-semibold">
                  {WEEKDAY_LABELS[WEEKDAYS[i]!]}
                </span>
                <span class="text-xs opacity-75">
                  {day.getMonth() + 1}/{day.getDate()}
                </span>
                {#if holiday}
                  <span class="rounded px-1.5 py-0.2 text-xs font-normal bg-destructive/15 text-destructive">
                    休講
                  </span>
                {/if}
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <!-- 行は時限表の並び順。授業は時限の番号で引くため、並べ替えても授業は時限に付いて動く -->
        {#each periods as periodSlot (periodSlot.period)}
          <tr class="border-b last:border-b-0">
            <td class="p-2 text-center text-xs font-mono opacity-75 border-r">
              <div class="font-semibold">{periodName(periodSlot)}</div>
              <div class="opacity-70 leading-tight mt-0.5">
                {periodSlot.start}<br />{periodSlot.end}
              </div>
            </td>
            {#each weekDays as day, dayIdx}
              {@const dayMap = weekLessons[dayIdx]}
              {@const occ = dayMap?.get(periodSlot.period - 1)}
              <td
                class="p-2 align-top border-r last:border-r-0 transition-colors"
                class:is-today={dayIdx === todayIndex}
              >
                {#if occ}
                  <div class="flex flex-col gap-1">
                    {#if occ.slot.url}
                      <a
                        href={occ.slot.url}
                        class="text-sm font-medium hover:underline leading-snug break-words"
                      >
                        {occ.slot.title}
                      </a>
                    {:else}
                      <span class="text-sm font-medium leading-snug break-words">
                        {occ.slot.title}
                      </span>
                    {/if}
                    <span class="text-xs opacity-60">
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
  /* Moodle に暗い配色が無いため、どの色も OS の配色に合わせて変えない。moodle は Moodle のカードと同じ色にする */
  /* 色ごとに値だけを決め、当て方は下の共通の規則にまとめる */
  .mimo-timetable-panel[data-mimo-color="moodle"] {
    --mimo-tt-bg: #ffffff;
    --mimo-tt-fg: #1d2125;
    --mimo-tt-border: #dee2e6;
    --mimo-tt-rule: #dee2e6;
    --mimo-tt-today: #e7f0f9;
  }

  .mimo-timetable-panel[data-mimo-color="white"] {
    --mimo-tt-bg: #ffffff;
    --mimo-tt-fg: #0f172a;
    --mimo-tt-border: #e2e8f0;
    --mimo-tt-rule: #f1f5f9;
    --mimo-tt-today: #f8fafc;
  }

  .mimo-timetable-panel[data-mimo-color="black"] {
    --mimo-tt-bg: #09090b;
    --mimo-tt-fg: #f4f4f5;
    --mimo-tt-border: #27272a;
    --mimo-tt-rule: #18181b;
    --mimo-tt-today: #18181b;
  }

  .mimo-timetable-panel[data-mimo-color="sky"] {
    --mimo-tt-bg: #f0f9ff;
    --mimo-tt-fg: #0c4a6e;
    --mimo-tt-border: #bae6fd;
    --mimo-tt-rule: #e0f2fe;
    --mimo-tt-today: #e0f2fe;
  }

  .mimo-timetable-panel[data-mimo-color="pink"] {
    --mimo-tt-bg: #fdf2f8;
    --mimo-tt-fg: #831843;
    --mimo-tt-border: #fbcfe8;
    --mimo-tt-rule: #fce7f3;
    --mimo-tt-today: #fce7f3;
  }

  .mimo-timetable-panel[data-mimo-color="green"] {
    --mimo-tt-bg: #f0fdf4;
    --mimo-tt-fg: #14532d;
    --mimo-tt-border: #bbf7d0;
    --mimo-tt-rule: #dcfce7;
    --mimo-tt-today: #dcfce7;
  }

  .mimo-timetable-panel[data-mimo-color] {
    background-color: var(--mimo-tt-bg);
    color: var(--mimo-tt-fg);
    border-color: var(--mimo-tt-border);
  }
  .mimo-timetable-panel[data-mimo-color] thead tr,
  .mimo-timetable-panel[data-mimo-color] tbody tr,
  .mimo-timetable-panel[data-mimo-color] td,
  .mimo-timetable-panel[data-mimo-color] th {
    border-color: var(--mimo-tt-rule);
  }
  .mimo-timetable-panel[data-mimo-color] .is-today {
    background-color: var(--mimo-tt-today);
  }

  /* リンクの色は moodle だけが持つ。他の色は文字色を引き継ぐ */
  .mimo-timetable-panel[data-mimo-color="moodle"] a {
    color: #0f6cbf;
  }
</style>
