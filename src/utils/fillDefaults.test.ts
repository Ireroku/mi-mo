import { describe, expect, it } from "vitest";
import { fillDefaults } from "./fillDefaults";

describe("fillDefaults", () => {
  it("欠けたキーを既定値から足す", () => {
    expect(fillDefaults<Record<string, unknown>>({ a: 1 }, { a: 0, b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it("入れ子のオブジェクトの中まで補う", () => {
    const defaults = { clock: { seconds: false, date: true }, n: 1 };
    const saved = { clock: { seconds: true }, n: 3 } as unknown as typeof defaults;
    expect(fillDefaults(saved, defaults)).toEqual({ clock: { seconds: true, date: true }, n: 3 });
  });

  it("配列は補わず、保存済みの値を残す", () => {
    expect(fillDefaults({ list: [1] }, { list: [1, 2, 3] })).toEqual({ list: [1] });
    expect(fillDefaults({ list: [] as number[] }, { list: [1] })).toEqual({ list: [] });
  });

  it("型の違う値は置き換えない", () => {
    const saved = { a: "x" } as unknown as { a: { b: number } };
    expect(fillDefaults(saved, { a: { b: 1 } })).toEqual({ a: "x" });
  });

  it("既定値に無いキーを残す", () => {
    const saved = { a: 1, extra: true } as unknown as { a: number };
    expect(fillDefaults(saved, { a: 0 })).toEqual({ a: 1, extra: true });
  });

  it("値が無ければ既定値を返す", () => {
    expect(fillDefaults(null as unknown as { a: number }, { a: 1 })).toEqual({ a: 1 });
    expect(fillDefaults({ a: null } as unknown as { a: number }, { a: 1 })).toEqual({ a: 1 });
  });

  it("引数を書き換えない", () => {
    const saved = { a: { b: 1 } } as unknown as { a: { b: number; c: number } };
    fillDefaults(saved, { a: { b: 0, c: 2 } });
    expect(saved).toEqual({ a: { b: 1 } });
  });
});
