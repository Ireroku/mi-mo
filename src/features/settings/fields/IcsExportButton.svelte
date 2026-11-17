<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { timetableSetting, periodTableSetting } from "@/utils/settings";
  import { buildIcs, ICS_FILENAME } from "@/features/timetable/ics";
  import { saveBlob } from "@/utils/download";
  import { Download } from "@lucide/svelte";

  async function handleExport() {
    const [config, periodTable] = await Promise.all([
      timetableSetting.getValue(),
      periodTableSetting.getValue(),
    ]);

    const icsContent = buildIcs(config, periodTable.periods);
    saveBlob(
      new Blob([icsContent], { type: "text/calendar;charset=utf-8" }),
      ICS_FILENAME,
    );
  }
</script>

<Button
  type="button"
  variant="outline"
  size="sm"
  class="gap-1.5"
  onclick={handleExport}
>
  <Download class="size-4" />
  カレンダー予定ファイルとして書き出す (.ics)
</Button>
