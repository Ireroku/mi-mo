<script lang="ts">
	// shadcn-svelte の元の部品にある年と月のドロップダウン（captionLayout）は外した。
	// bits-ui の MonthSelect / YearSelect が Svelte の customizable_select を呼び、
	// その中の innerHTML が Firefox Add-ons の自動検査で警告になるため。mi-mo は見出しの文字だけを使う
	import { DateFormatter, getLocalTimeZone, type DateValue } from "@internationalized/date";
	import type { Calendar as CalendarPrimitive } from "bits-ui";

	let {
		monthFormat,
		yearFormat,
		month,
		locale,
	}: {
		monthFormat: CalendarPrimitive.RootProps["monthFormat"];
		yearFormat: CalendarPrimitive.RootProps["yearFormat"];
		month: DateValue;
		locale: string;
	} = $props();

	function formatYear(date: DateValue) {
		const dateObj = date.toDate(getLocalTimeZone());
		if (typeof yearFormat === "function") return yearFormat(dateObj.getFullYear());
		return new DateFormatter(locale, { year: yearFormat }).format(dateObj);
	}

	function formatMonth(date: DateValue) {
		const dateObj = date.toDate(getLocalTimeZone());
		if (typeof monthFormat === "function") return monthFormat(dateObj.getMonth() + 1);
		return new DateFormatter(locale, { month: monthFormat }).format(dateObj);
	}
</script>

{formatMonth(month)} {formatYear(month)}
