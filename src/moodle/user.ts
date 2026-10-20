// ログイン状態の判定と表示名の読み取りを行う。
// 複数の機能が同じ情報を必要とするため src/moodle/ に置く。

/**
 * ログイン中かどうかを判定する。
 * document.body に notloggedin クラスが付いていなければ true を返す。
 * body が存在しない段階（document_start）では false を返す。
 */
export function isLoggedIn(): boolean {
  const { body } = document;
  if (!body) {
    return false;
  }

  return !body.classList.contains("notloggedin");
}

/**
 * ログイン中のユーザー表示名をユーザーメニューから読み取る。
 * 1. #usernavigation [data-region="usermenu"] .avatar.current [title] を探す
 * 2. 見つかれば title 属性の値を返す
 * 3. 見つからない場合、#usernavigation [data-region="usermenu"] .avatar.current img[alt] を探し、alt の値を返す
 * 4. どちらも見つからない、または値が空の場合は undefined を返す
 */
export function readUserName(): string | undefined {
  const nav = document.querySelector(
    '#usernavigation [data-region="usermenu"] .avatar.current [title]',
  );
  if (nav) {
    const title = nav.getAttribute("title")?.trim();
    if (title) {
      return title;
    }
  }

  const img = document.querySelector<HTMLImageElement>(
    '#usernavigation [data-region="usermenu"] .avatar.current img[alt]',
  );
  if (img) {
    const alt = img.getAttribute("alt")?.trim();
    if (alt) {
      return alt;
    }
  }

  return undefined;
}
