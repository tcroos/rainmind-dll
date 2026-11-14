import path from "node:path";
import { fileURLToPath } from "node:url";

import { generationRuntimeEnvironment, superviseGenerationRuntime } from "./generation-runtime.mjs";

const mode = process.argv[2];
if (mode !== "dev") throw new Error("Usage: run-app.mjs dev");

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextEntry = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const runtime = generationRuntimeEnvironment({ allowEphemeralToken: true });
const environment = { ...runtime.environment, NEXT_DIST_DIR: runtime.environment.NEXT_DIST_DIR?.trim() || ".next-dev" };
// 默认走 Turbopack：webpack 在 7k+ 文件规模下堆内存会涨到 5GB+，GC 停顿让热更新和请求都变卡。
// 需要回退时设置 NEXT_DEV_BUNDLER=webpack 即可，其余启动参数不变。
const bundler = process.env.NEXT_DEV_BUNDLER?.trim().toLowerCase() === "webpack" ? "--webpack" : "--turbopack";
if (runtime.ephemeralToken) console.log("Generated ephemeral maintenance and worker tokens for this local development process.");

process.exitCode = await superviseGenerationRuntime({
    app: { command: process.execPath, args: [nextEntry, "dev", bundler, "-H", "0.0.0.0", "-p", "3000"], cwd: webRoot },
    workerScript: path.join(webRoot, "scripts", "generation-worker.mjs"),
    environment,
});
