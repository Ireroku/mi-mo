<script lang="ts">
  import ActionRow from "../controls/ActionRow.svelte";
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

<ActionRow
  label="カレンダー予定ファイルとして書き出す (.ics)"
  icon={Download}
  onclick={handleExport}
/>
