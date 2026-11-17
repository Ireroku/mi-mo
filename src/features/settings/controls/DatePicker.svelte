<script lang="ts">
  // 日付を "YYYY-MM-DD" で選ぶ。ボタンを押すと、日本語の暦が開く
  import { Button } from "$lib/components/ui/button";
  import { Calendar } from "$lib/components/ui/calendar";
  import * as Popover from "$lib/components/ui/popover";
  import { DateFormatter, getLocalTimeZone, parseDate, type DateValue } from "@internationalized/date";
  import { CalendarDays } from "@lucide/svelte";

  interface Props {
    value: string; // "YYYY-MM-DD"。未入力は ""
    onChange: (next: string) => void;
    id?: string;
  }

  let { value, onChange, id }: Props = $props();

  const LOCALE = "ja";
  const formatter = new DateFormatter(LOCALE, { dateStyle: "medium" });

  let open = $state(false);

  // 形式の合わない値は未入力として扱う
  let date = $derived.by((): DateValue | undefined => {
    try {
      return parseDate(value);
    } catch {
      return undefined;
    }
  });
</script>

<Popover.Root bind:open>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button
        {...props}
        {id}
        variant="outline"
        class="h-8 shrink-0 gap-1.5 px-2.5 font-normal tabular-nums"
      >
        <CalendarDays class="text-muted-foreground" />
        {#if date}
          {formatter.format(date.toDate(getLocalTimeZone()))}
        {:else}
          <span class="text-muted-foreground">日付を選ぶ</span>
        {/if}
      </Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content align="end" class="w-auto p-0">
    <Calendar
      type="single"
      value={date}
      placeholder={date}
      locale={LOCALE}
      onValueChange={(next) => {
        if (next) {
          onChange(next.toString());
          open = false;
        }
      }}
    />
  </Popover.Content>
</Popover.Root>
