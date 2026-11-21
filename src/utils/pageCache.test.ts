import { describe, expect, it } from "vitest";
import { parsePageCache } from "./pageCache";

describe("parsePageCache", () => {
  it("同じ版の写しから値を取り出す", () => {
    const raw = JSON.stringify({ version: "1.2.0", value: { hidden: true } });
    expect(parsePageCache(raw, "1.2.0")).toEqual({ hidden: true });
  });

  it("版が違えば使わない", () => {
    const raw = JSON.stringify({ version: "1.1.0", value: { hidden: true } });
    expect(parsePageCache(raw, "1.2.0")).toBeUndefined();
  });

  it("写しが無ければ undefined を返す", () => {
    expect(parsePageCache(null, "1.2.0")).toBeUndefined();
  });

  it("壊れた文字列や形の違う値は使わない", () => {
    expect(parsePageCache("{", "1.2.0")).toBeUndefined();
    expect(parsePageCache("null", "1.2.0")).toBeUndefined();
    expect(parsePageCache(JSON.stringify({ version: "1.2.0" }), "1.2.0")).toBeUndefined();
  });
});
