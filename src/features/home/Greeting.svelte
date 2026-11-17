<script lang="ts">
  interface Props {
    salutation: string;
    userName: string | undefined;
    message: string | undefined;
  }

  let { salutation, userName, message }: Props = $props();

  // 「こんにちは、〇〇さん」。言葉と名前のうち、ある方だけを並べる
  let heading = $derived(
    [salutation, userName && `${userName}さん`].filter(Boolean).join("、"),
  );
</script>

{#if heading || message}
  <div class="mb-4 rounded-lg bg-card p-4 text-card-foreground shadow-sm">
    {#if heading}
      <h2 class="text-xl font-bold tracking-tight">
        {heading}
      </h2>
    {/if}
    {#if message}
      <p class="mt-1 text-sm text-muted-foreground">
        {message}
      </p>
    {/if}
  </div>
{/if}
