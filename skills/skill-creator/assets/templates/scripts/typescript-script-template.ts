#!/usr/bin/env bun
// =============================================================================
// TypeScript 脚本模板 (Bun runtime)
// =============================================================================
// 用途: 简要说明脚本用途
// 用法: bun script.ts <参数1> <参数2>
// 依赖: Bun 1.0+
// 注意: Bun 原生支持 TypeScript，无需编译。
//       在 SKILL.md 中用相对路径 `scripts/xxx.ts` 引用本文件（详见
//       skill-creator/references/path-resolution.md）。
// =============================================================================

import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

// -----------------------------------------------------------------------------
// 类型定义
// -----------------------------------------------------------------------------

interface Config {
    name: string;
    version: string;
    debug?: boolean;
}

interface ProcessedResult {
    success: boolean;
    data: unknown;
    timestamp: string;
}

// -----------------------------------------------------------------------------
// 工具函数
// -----------------------------------------------------------------------------

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * 日志输出
 */
function log(level: "INFO" | "ERROR" | "WARN", message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}

function logInfo(message: string): void {
    log("INFO", message);
}

function logError(message: string): void {
    log("ERROR", message);
}

/**
 * 读取 JSON 文件
 */
async function readJsonFile<T>(filePath: string): Promise<T> {
    try {
        const content = await readFile(filePath, "utf-8");
        return JSON.parse(content) as T;
    } catch (error) {
        logError(`Failed to read JSON file: ${filePath}`);
        throw error;
    }
}

/**
 * 写入 JSON 文件
 */
async function writeJsonFile(
    filePath: string,
    data: unknown,
    pretty: boolean = true
): Promise<void> {
    const content = pretty
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);
    await writeFile(filePath, content, "utf-8");
    logInfo(`Written to: ${filePath}`);
}

/**
 * 处理数据
 */
async function processData(inputPath: string, options?: { verbose?: boolean }): Promise<ProcessedResult> {
    const { verbose = false } = options || {};

    if (verbose) {
        logInfo(`Processing: ${inputPath}`);
    }

    // 读取输入
    const inputStat = await stat(inputPath);
    if (!inputStat.isFile()) {
        throw new Error(`Not a file: ${inputPath}`);
    }

    const content = await readFile(inputPath, "utf-8");

    // 处理逻辑
    const result: ProcessedResult = {
        success: true,
        data: {
            path: inputPath,
            size: inputStat.size,
            lines: content.split("\n").length,
            preview: content.slice(0, 100),
        },
        timestamp: new Date().toISOString(),
    };

    return result;
}

// -----------------------------------------------------------------------------
// 主逻辑
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log(`
Usage: bun script.ts <input-file> [options]

Options:
    --output <file>    Output file path
    --verbose          Verbose output
    --help             Show this help

Examples:
    bun script.ts input.txt
    bun script.ts data.json --output result.json --verbose
        `);
        process.exit(1);
    }

    const inputPath = args[0];
    const outputIndex = args.indexOf("--output");
    const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : undefined;
    const verbose = args.includes("--verbose");

    try {
        logInfo(`Starting process for: ${inputPath}`);

        const result = await processData(inputPath, { verbose });

        if (outputPath) {
            await writeJsonFile(outputPath, result);
        } else {
            console.log(JSON.stringify(result, null, 2));
        }

        logInfo("Done!");
    } catch (error) {
        logError(`Process failed: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();
