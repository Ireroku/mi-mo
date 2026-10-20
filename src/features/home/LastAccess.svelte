<script lang="ts">
  interface Props {
    previous: string;
  }

  let { previous }: Props = $props();

  function formatDateTime(iso: string): string {
    if (!iso) {
      return "";
    }

    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  let formatted = $derived(formatDateTime(previous));
</script>

{#if formatted}
  <div class="mb-4 text-xs text-muted-foreground">
    前回のアクセス: {formatted}
  </div>
{/if}
