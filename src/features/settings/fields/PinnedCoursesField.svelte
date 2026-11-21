<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { CourseRef } from "@/moodle/courseList";
  import { courseListCacheSetting } from "@/utils/settings";
  import { Switch } from "$lib/components/ui/switch";

  let { value, onChange }: CustomFieldProps<CourseRef[]> = $props();

  let pinned = $derived(value || []);
  let availableCourses = $state<CourseRef[]>([]);

  courseListCacheSetting.getValue().then((cache) => {
    availableCourses = cache.courses;
  });

  function isPinned(course: CourseRef): boolean {
    return pinned.some((c) => c.id === course.id);
  }

  function toggleCourse(course: CourseRef, checked: boolean) {
    if (checked) {
      if (!pinned.some((c) => c.id === course.id)) {
        onChange([...pinned, course]);
      }
    } else {
      onChange(pinned.filter((c) => c.id !== course.id));
    }
  }
</script>

<!-- 設定画面が残りの高さを渡す（fill）。一覧はその高さまで伸び、超えた分は中でスクロールする -->
<div class="flex min-h-0 w-full flex-col gap-2">
  {#if availableCourses.length === 0}
    <p class="text-note text-muted-foreground">
      一度マイコースまたはホームを開くと、履修中のコースがここに表示されます。
    </p>
  {:else}
    <div
      class="flex min-h-0 flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-md border bg-background/50 p-2"
    >
      {#each availableCourses as course (course.id)}
        <div class="flex items-center justify-between gap-2 py-1">
          <span class="min-w-0 truncate text-note">
            {course.title}
          </span>
          <Switch
            size="sm"
            aria-label={course.title}
            checked={isPinned(course)}
            onCheckedChange={(checked) => toggleCourse(course, checked)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
