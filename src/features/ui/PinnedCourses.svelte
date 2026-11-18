<script lang="ts">
  import type { CourseRef } from "@/moodle/courseList";
  import DrawerBlock from "./DrawerBlock.svelte";

  interface Props {
    courses: CourseRef[];
  }

  let { courses }: Props = $props();
</script>

{#if courses.length > 0}
  <DrawerBlock title="ピン留め">
    <ul class="list-unstyled mb-0 space-y-1">
      {#each courses as course (course.id)}
        <li>
          <a
            href={course.url}
            class="block truncate text-sm text-primary hover:underline"
            title={course.title}
          >
            {course.title}
          </a>
        </li>
      {/each}
    </ul>
  </DrawerBlock>
{/if}
