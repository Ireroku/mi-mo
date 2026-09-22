<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { timetableSetting, periodTableSetting } from "@/utils/settings";
  import { buildIcs, ICS_FILENAME } from "@/features/timetable/ics";
  import { Download } from "@lucide/svelte";

  async function handleExport() {
    const [config, periodTable] = await Promise.all([
      timetableSetting.getValue(),
      periodTableSetting.getValue(),
    ]);

    const icsContent = buildIcs(config, periodTable.periods);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = ICS_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<div class="pt-2">
  <Button
    type="button"
    variant="outline"
    size="sm"
    class="gap-1.5 text-xs"
    onclick={handleExport}
  >
    <Download class="size-4" />
    カレンダー (.ics) を書き出す
  </Button>
</div>
