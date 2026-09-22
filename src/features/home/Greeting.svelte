<script lang="ts">
  interface Props {
    userName: string | undefined;
    message: string | undefined;
  }

  let { userName, message }: Props = $props();
</script>

{#if userName || message}
  <div class="mb-4 rounded-lg bg-card p-4 text-card-foreground shadow-sm">
    {#if userName}
      <h2 class="text-xl font-bold tracking-tight">
        {userName} さん
      </h2>
    {/if}
    {#if message}
      <p class="mt-1 text-sm text-muted-foreground">
        {message}
      </p>
    {/if}
  </div>
{/if}
