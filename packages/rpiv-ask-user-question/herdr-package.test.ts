import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("DLE Labs Pi package", () => {
	it("identifies the fork and exposes only the patched questionnaire", () => {
		const manifest = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
		expect(manifest.name).toBe("@dle-labs/rpiv");
		expect(manifest.repository).toBe("github:dle-labs/rpiv-mono");
		expect(manifest.private).toBe(true);
		expect(manifest.pi).toEqual({
			extensions: ["./packages/rpiv-ask-user-question/index.ts"],
			skills: [],
			prompts: [],
			themes: [],
		});
	});

	it("ships the standalone bridge and its source license", () => {
		const manifest = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
		expect(manifest.files).toContain("herdr-bridge.ts");
		expect(manifest.files).toContain("HERDR_WEB_UI_LICENSE");
		expect(readFileSync(new URL("./HERDR_WEB_UI_LICENSE", import.meta.url), "utf8")).toContain(
			"Copyright (c) 2026 devswha",
		);
	});
});
