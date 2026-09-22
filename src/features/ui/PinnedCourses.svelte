<script lang="ts">
  import type { CourseRef } from "@/moodle/courseList";

  interface Props {
    courses: CourseRef[];
  }

  let { courses }: Props = $props();
</script>

{#if courses.length > 0}
  <section class="card mb-3 block">
    <div class="card-body p-3">
      <h5 class="card-title h6 mb-2 font-bold text-foreground">ピン留め</h5>
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
    </div>
  </section>
{/if}
