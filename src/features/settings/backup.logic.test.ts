import { describe, expect, it } from "vitest";
import { buildBackup, parseBackup } from "./backup.logic";

const current = {
  "local:a": { enabled: true, items: ["x"], name: "now" },
  "local:b": { enabled: false },
};

describe("parseBackup", () => {
  it("書き出したものをそのまま取り込める", () => {
    const saved = {
      "local:a": { enabled: false, items: [], name: "saved" },
      "local:b": { enabled: true },
    };
    const text = JSON.stringify(buildBackup(saved));
    expect(parseBackup(text, current)).toEqual(saved);
  });

  it("種類の違う値と知らないキーは取り込まず、今の値を残す", () => {
    const text = JSON.stringify(
      buildBackup({
        "local:a": { enabled: "yes", items: { 0: "x" }, extra: 1 },
        "local:unknown": { enabled: true },
      }),
    );
    expect(parseBackup(text, current)).toEqual({ "local:a": current["local:a"] });
  });

  it("mi-mo のバックアップでなければ例外を投げる", () => {
    expect(() => parseBackup('{"settings":{}}', current)).toThrow();
    expect(() => parseBackup("[]", current)).toThrow();
    expect(() => parseBackup("not json", current)).toThrow();
  });
});
