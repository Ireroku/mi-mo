<script lang="ts">
  import type { FooterProps } from "../types";
  import type { BackupScope } from "../backup.logic";
  import type { TimetableConfig } from "@/features/timetable/types";
  import type { PeriodTableConfig } from "@/utils/periods";
  import { periodTableSetting, timetableSetting } from "@/utils/settings";
  import BackupButtons from "../BackupButtons.svelte";
  import IcsExportButton from "./IcsExportButton.svelte";

  const TIMETABLE_FILENAME = "mi-mo-timetable.json";

  // 時間割の中身にあたる項目と、授業の並ぶ時限表。表示の入り切りと配色は、受け取る側の好みのため入れない。
  // 時限表の無い古いファイルを読んだ場合は、今の時限表を残す
  const TIMETABLE_FILE_KEYS: readonly (keyof TimetableConfig)[] = [
    "grid",
    "holidays",
    "substitutes",
    "startDate",
    "lessonCount",
  ];
  const PERIOD_FILE_KEYS: readonly (keyof PeriodTableConfig)[] = ["periods"];
  const SCOPE: BackupScope = {
    [timetableSetting.key]: TIMETABLE_FILE_KEYS,
    [periodTableSetting.key]: PERIOD_FILE_KEYS,
  };

  let { values, onRestore }: FooterProps = $props();
</script>

<!-- 外のカードの中で、行ボタンを区切り線で分けて並べる -->
<div class="divide-y divide-border">
  <BackupButtons
    {values}
    {onRestore}
    filename={TIMETABLE_FILENAME}
    scope={SCOPE}
    noun="時間割"
  />
  <IcsExportButton />
</div>
