// 確認用: 拡張機能の API を localStorage で代用する。拡張機能の外でページを開くためだけに使う
(() => {
  const KEY = "mimo-harness-storage";
  const load = () => JSON.parse(localStorage.getItem(KEY) ?? "{}");
  const save = (all) => localStorage.setItem(KEY, JSON.stringify(all));
  const listeners = new Set();
  const emit = (changes) => listeners.forEach((listener) => listener(changes, "local"));
  const event = {
    addListener: (listener) => listeners.add(listener),
    removeListener: (listener) => listeners.delete(listener),
  };

  const area = {
    async get(keys) {
      const all = load();

      if (keys == null) {
        return all;
      }

      const list =
        typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
      return Object.fromEntries(list.filter((key) => key in all).map((key) => [key, all[key]]));
    },
    async set(items) {
      const all = load();
      const changes = {};

      for (const [key, value] of Object.entries(items)) {
        changes[key] = { oldValue: all[key], newValue: value };
        all[key] = value;
      }

      save(all);
      emit(changes);
    },
    async remove(keys) {
      const all = load();
      const changes = {};

      for (const key of [keys].flat()) {
        changes[key] = { oldValue: all[key] };
        delete all[key];
      }

      save(all);
      emit(changes);
    },
    async clear() {
      save({});
    },
    onChanged: event,
  };

  const noopEvent = { addListener() {}, removeListener() {} };

  globalThis.chrome = {
    runtime: {
      id: "harness",
      getURL: (path) => path,
      getManifest: () => ({ version: "0.0.0" }),
      sendMessage: async () => undefined,
      onMessage: noopEvent,
      openOptionsPage() {},
    },
    storage: { local: area, session: area, sync: area, onChanged: event },
  };
})();
