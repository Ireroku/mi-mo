<script lang="ts">
  // 取り消せない操作の前に、続けるかを尋ねる。続ける時だけ onConfirm を呼ぶ
  import * as AlertDialog from "$lib/components/ui/alert-dialog";

  interface Props {
    open: boolean;
    title: string; // 尋ねる文
    confirmLabel: string; // 続けるボタンの文言
    onConfirm: () => void;
  }

  let { open = $bindable(), title, confirmLabel, onConfirm }: Props = $props();
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content size="sm">
    <AlertDialog.Header>
      <AlertDialog.Title class="text-row font-normal">{title}</AlertDialog.Title>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>キャンセル</AlertDialog.Cancel>
      <!-- bits-ui の Action は押しても閉じないため、ここで閉じる -->
      <AlertDialog.Action
        onclick={() => {
          open = false;
          onConfirm();
        }}
      >
        {confirmLabel}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
