<script lang="ts">
  import type { CustomFieldProps } from "../types";
  import type { CourseRef } from "@/moodle/courseList";
  import { courseListCacheSetting } from "@/utils/settings";
  import { Switch } from "$lib/components/ui/switch";
  import { Label } from "$lib/components/ui/label";

  let { value, onChange }: CustomFieldProps<CourseRef[]> = $props();

  let availableCourses = $state<CourseRef[]>([]);

  $effect(() => {
    courseListCacheSetting.getValue().then((cache) => {
      availableCourses = cache.courses;
    });
  });

  function isPinned(course: CourseRef): boolean {
    return (value || []).some((c) => c.id === course.id);
  }

  function toggleCourse(course: CourseRef, checked: boolean) {
    const current = value || [];
    if (checked) {
      if (!current.some((c) => c.id === course.id)) {
        onChange([...current, course]);
      }
    } else {
      onChange(current.filter((c) => c.id !== course.id));
    }
  }
</script>

<div class="flex flex-col gap-2 w-full">
  {#if availableCourses.length === 0}
    <p class="text-note text-muted-foreground">
      一度マイコースまたはホームを開くと、履修中のコースがここに表示されます。
    </p>
  {:else}
    <div
      class="flex flex-col gap-1.5 max-h-60 overflow-y-auto rounded-md border p-2 bg-background/50"
    >
      {#each availableCourses as course}
        <div class="flex items-center justify-between gap-2 py-1">
          <span class="text-note truncate max-w-64">
            {course.title}
          </span>
          <Switch
            size="sm"
            checked={isPinned(course)}
            onCheckedChange={(checked) => toggleCourse(course, checked)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
