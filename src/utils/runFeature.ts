// 機能1つの初期化を、他の機能から切り離して実行する。

/**
 * init を実行し、例外や reject を握って console.error へ出す。
 * 1つの機能が失敗しても、entrypoint の後続の機能を止めない。
 */
export async function runFeature(
  name: string,
  init: () => void | Promise<void>,
): Promise<void> {
  try {
    await init();
  } catch (error) {
    console.error(`[mi-mo] ${name}`, error);
  }
}
