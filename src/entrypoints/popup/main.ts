import { mount } from "svelte";
import App from "./App.svelte";
import { syncColorScheme } from "@/utils/theme";
import "@/assets/global.css";

syncColorScheme();

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
