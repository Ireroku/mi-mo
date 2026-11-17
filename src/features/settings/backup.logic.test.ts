import { describe, expect, it } from "vitest";
import {
  buildBackup,
  narrowValues,
  parseBackup,
  parseScopedBackup,
} from "./backup.logic";

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

const scope = { groupId: "local:a", keys: ["items", "name"] };

describe("narrowValues", () => {
  it("範囲のグループとキーだけを残す", () => {
    expect(narrowValues(current, scope)).toEqual({
      "local:a": { items: ["x"], name: "now" },
    });
  });

  it("グループに無いキーは足さない", () => {
    expect(
      narrowValues(current, { groupId: "local:b", keys: ["enabled", "none"] }),
    ).toEqual({ "local:b": { enabled: false } });
  });
});

describe("parseScopedBackup", () => {
  it("範囲のキーだけを取り込み、範囲の外は今の値を残す", () => {
    const text = JSON.stringify(
      buildBackup({
        "local:a": { enabled: false, items: ["y"], name: "saved" },
        "local:b": { enabled: true },
      }),
    );

    expect(parseScopedBackup(text, current, scope)).toEqual({
      "local:a": { enabled: true, items: ["y"], name: "saved" },
    });
  });

  it("範囲だけを書き出したファイルを取り込める", () => {
    const saved = { "local:a": { enabled: false, items: [], name: "saved" } };
    const text = JSON.stringify(buildBackup(narrowValues(saved, scope)));

    expect(parseScopedBackup(text, current, scope)).toEqual({
      "local:a": { enabled: true, items: [], name: "saved" },
    });
  });

  it("ファイルに範囲のグループが無ければ例外を投げる", () => {
    const text = JSON.stringify(buildBackup({ "local:b": { enabled: true } }));

    expect(() => parseScopedBackup(text, current, scope)).toThrow();
  });
});
