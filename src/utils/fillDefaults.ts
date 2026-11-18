// 保存済みの設定に欠けているキーを、既定値から補う。

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

// 既定値にあって value に無いキー（undefined と null）を足す。入れ子のオブジェクトは中まで補う。
// 配列と、既定値と型の違う値は value のまま残す。
export function fillDefaults<T>(value: T, defaults: T): T {
  if (value === undefined || value === null) return defaults;
  if (!isPlainObject(value) || !isPlainObject(defaults)) return value;
  const filled: Record<string, unknown> = { ...value };
  for (const [key, fallback] of Object.entries(defaults)) {
    filled[key] = fillDefaults(value[key], fallback);
  }
  return filled as T;
}
