<script lang="ts">
  import type { AttendanceStats } from "./autoattendStats";
  import { Badge } from "$lib/components/ui/badge";

  interface Props {
    stats: AttendanceStats;
  }

  let { stats }: Props = $props();
</script>

<div
  class="my-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-xs font-sans"
>
  <div class="flex items-baseline gap-3">
    <span class="text-sm text-muted-foreground">出席率</span>
    <span class="text-2xl font-bold tracking-tight text-foreground">
      {stats.rate}%
    </span>
  </div>

  <div class="flex flex-wrap items-center gap-1.5">
    <Badge variant="outline" class="text-sm">
      出席: {stats.present}
    </Badge>
    <Badge variant="outline" class="text-sm">
      遅刻: {stats.late}
    </Badge>
    <Badge variant="outline" class="text-sm">
      早退: {stats.earlyLeave}
    </Badge>
    <Badge variant="outline" class="text-sm">
      欠席: {stats.absent}
    </Badge>

    {#if stats.detailUrl}
      <a
        href={stats.detailUrl}
        class="ml-2 text-sm text-primary hover:underline"
      >
        詳細
      </a>
    {/if}
  </div>
</div>
