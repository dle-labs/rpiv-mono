import { createMockCtx, createMockPi } from "@juicesharp/rpiv-test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerAskUserQuestionTool } from "./ask-user-question.js";

const bridgeMocks = vi.hoisted(() => ({ instances: [] as Array<{ close: ReturnType<typeof vi.fn> }> }));
vi.mock("./herdr-bridge.js", () => ({
	createBridge: vi.fn(() => {
		const bridge = { close: vi.fn(), mount: vi.fn(), publish: vi.fn() };
		bridgeMocks.instances.push(bridge);
		return bridge;
	}),
}));

const params = {
	questions: [
		{ question: "Choose a fictional fixture?", header: "Fixture", options: [{ label: "Alpha" }, { label: "Beta" }] },
	],
};
const cancelled = { answers: [], cancelled: true };

function harness(custom: () => Promise<unknown>) {
	const { pi, captured } = createMockPi();
	registerAskUserQuestionTool(pi);
	const tool = captured.tools.get("ask_user_question")!;
	const ctx = createMockCtx({ hasUI: true, ui: { custom: vi.fn(custom) } as never });
	return {
		captured,
		execute: () =>
			tool.execute!("synthetic-call", params as never, undefined as never, undefined as never, ctx as never),
		shutdown: () => {
			for (const handler of captured.events.get("session_shutdown") ?? []) handler();
		},
	};
}

beforeEach(() => {
	bridgeMocks.instances.length = 0;
});

describe("herdr bridge lifecycle", () => {
	it("keeps one shutdown listener across repeated tools, including hosts whose on() returns void", async () => {
		const run = harness(async () => cancelled);
		await run.execute();
		await run.execute();
		expect(run.captured.events.get("session_shutdown")).toHaveLength(1);
		expect(bridgeMocks.instances).toHaveLength(2);
		for (const bridge of bridgeMocks.instances) expect(bridge.close).toHaveBeenCalledTimes(1);
		run.shutdown();
		for (const bridge of bridgeMocks.instances) expect(bridge.close).toHaveBeenCalledTimes(1);
	});

	it("closes and releases the bridge when the UI rejects", async () => {
		const run = harness(async () => {
			throw new Error("synthetic UI failure");
		});
		await expect(run.execute()).rejects.toThrow("synthetic UI failure");
		expect(bridgeMocks.instances[0]!.close).toHaveBeenCalledTimes(1);
		run.shutdown();
		expect(bridgeMocks.instances[0]!.close).toHaveBeenCalledTimes(1);
	});

	it("closes a waiting questionnaire on shutdown and still runs final cleanup", async () => {
		let enter!: () => void;
		let finish!: (value: unknown) => void;
		const entered = new Promise<void>((resolve) => {
			enter = resolve;
		});
		const result = new Promise<unknown>((resolve) => {
			finish = resolve;
		});
		const run = harness(async () => {
			enter();
			return result;
		});
		const pending = run.execute();
		await entered;
		try {
			run.shutdown();
			expect(bridgeMocks.instances[0]!.close).toHaveBeenCalledTimes(1);
		} finally {
			finish(cancelled);
			await pending;
		}
		expect(bridgeMocks.instances[0]!.close).toHaveBeenCalledTimes(2);
		run.shutdown();
		expect(bridgeMocks.instances[0]!.close).toHaveBeenCalledTimes(2);
	});
});
