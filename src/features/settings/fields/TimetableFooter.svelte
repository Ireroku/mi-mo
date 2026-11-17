<script lang="ts">
  import type { FooterProps } from "../types";
  import type { TimetableConfig } from "@/features/timetable/types";
  import { timetableSetting } from "@/utils/settings";
  import BackupButtons from "../BackupButtons.svelte";
  import IcsExportButton from "./IcsExportButton.svelte";

  const TIMETABLE_FILENAME = "mi-mo-timetable.json";

  // 時間割の中身にあたる項目。表示の入り切りと配色は、受け取る側の好みのため入れない
  const TIMETABLE_FILE_KEYS: readonly (keyof TimetableConfig)[] = [
    "grid",
    "holidays",
    "substitutes",
    "startDate",
    "lessonCount",
  ];

  let { values, onRestore }: FooterProps = $props();
</script>

<div class="space-y-4 pt-2">
  <div>
    <BackupButtons
      {values}
      {onRestore}
      filename={TIMETABLE_FILENAME}
      scope={{ groupId: timetableSetting.key, keys: TIMETABLE_FILE_KEYS }}
      noun="時間割"
    />
    <p class="mt-2 text-note text-muted-foreground">
      授業科目、休講日、振替日、学期の開始日、授業の回数を出し入れします。読み込むと、今の内容と入れ替わります
    </p>
  </div>
  <IcsExportButton />
</div>
