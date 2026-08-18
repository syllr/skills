#!/usr/bin/env python3
"""C4 Container Diagram 图编辑工作台 — 提取/迭代/回写一条龙

用法:
  python3 scripts/d2-workbench.py extract <md文件> [图序号] [--out 目录]
      从 Markdown 提取第 N 个 ```d2 代码块 → 工作区生成 <名>.d2/.svg/.png
      + verify-svg.py 校验 + viewBox 检查。改图从这里开始（工作区 .d2 是独立文件，
      可直接编辑，无 Markdown/转义干扰）。
  python3 scripts/d2-workbench.py render <file.d2>
      渲染单个 .d2 → .svg (+.png) + verify + viewBox。改图迭代主命令。
  python3 scripts/d2-workbench.py sync <md文件> <file.d2> [图序号]
      用工作区 .d2 内容替换 md 第 N 个 d2 代码块 + 重新渲染 base64 fallback
      替换旧 img（自动删除所有旧 fallback 只留一份）。

设计要点（解决反复踩的坑）:
- 提取/写入全部走 Python 文件 IO，不经 shell 转义 → 杜绝 \\n 变真实换行
- 工作区 .d2 是权威修改对象，改完 sync 回 Markdown（避免在文档里直接改被转义）
- 每次渲染自动跑 verify-svg.py + viewBox 检查，改完即验收，无需另跑命令
"""

import argparse
import base64
import os
import re
import subprocess
import sys
import shutil

VERIFY_SCRIPT = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "verify-svg.py"
)
D2_BLOCK_RE = re.compile(r"```d2\n(.*?)```", re.DOTALL)
FALLBACK_RE = re.compile(r"\n<!-- D2 渲染 Fallback SVG.*?/>\n", re.DOTALL)


def err(msg):
    print(f"🔴 {msg}", file=sys.stderr)
    sys.exit(1)


def run(cmd, desc):
    """执行命令，失败即报错退出。列表参数传递，无 shell 转义。"""
    print(f"  · {desc}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        err(f"{desc}失败: {r.stderr.strip() or r.stdout.strip()}")
    return r


def check_d2():
    if not shutil.which("d2"):
        err("d2 命令未安装（brew install d2）")


def extract_blocks(md_path):
    """返回所有 d2 代码块内容列表。"""
    content = open(md_path, encoding="utf-8").read()
    blocks = D2_BLOCK_RE.findall(content)
    if not blocks:
        err(f"{md_path} 中未找到任何 ```d2 代码块")
    return blocks, content


def check_viewbox(svg_path):
    """viewBox 必须是正数且合理；-9e18 即整数溢出（§6.16）。"""
    svg = open(svg_path, encoding="utf-8").read()
    m = re.search(r'viewBox="([^"]*)"', svg)
    if not m:
        err(f"{svg_path} 无 viewBox")
    assert m is not None
    vb = m.group(1)
    nums = [float(x) for x in vb.split()]
    if len(nums) != 4:
        err(f"viewBox 格式异常: {vb}")
    x, y, w, h = nums
    if x < -1 or y < -1 or w <= 0 or h <= 0 or w > 100000 or h > 100000:
        print(
            f"  ⚠️ viewBox 异常: {vb} — 可能整数溢出（§6.16），检查: 单 class / 外层 1×1 grid / 竖条不设 width"
        )
        return False
    print(f"  · viewBox: {vb} ✓")
    return True


def render_and_verify(d2_path, out_stem, want_png=True):
    """渲染 .d2 → .svg(+.png) + verify-svg.py + viewBox 检查。"""
    check_d2()
    svg = out_stem + ".svg"
    run(["d2", d2_path, svg], f"d2 渲染 → {os.path.basename(svg)}")
    ok = check_viewbox(svg)
    r = run(["python3", VERIFY_SCRIPT, svg], "verify-svg.py 校验")
    png = None
    if want_png and shutil.which("sips"):
        png = out_stem + ".png"
        run(
            ["sips", "-s", "format", "png", svg, "--out", png],
            f"sips 转 PNG → {os.path.basename(png)}",
        )
    png_note = f" + {os.path.basename(png)}" if png else ""
    print(f"\n✅ 工作产物: {svg}{png_note}")
    if r.returncode == 0 and ok:
        print("✅ verify 全部通过")
    else:
        print("⚠️ verify 未全过 / viewBox 异常，按输出修复后重跑 render")
    return r.returncode == 0 and ok


def cmd_extract(args):
    blocks, _ = extract_blocks(args.md)
    n = (args.index or 1) - 1
    if n >= len(blocks):
        err(f"{args.md} 只有 {len(blocks)} 个 d2 块，图序号 {args.index} 越界")
    d2_code = blocks[n]
    out_dir = args.out or "."
    os.makedirs(out_dir, exist_ok=True)
    stem = os.path.join(
        out_dir,
        f"{os.path.splitext(os.path.basename(args.md))[0]}-fig{args.index or 1}",
    )
    d2_path = stem + ".d2"
    # 直接文件写入，不经 shell → 保持 \\n 字面量
    open(d2_path, "w", encoding="utf-8").write(d2_code)
    print(f"已提取第 {args.index or 1} 个 d2 块 → {d2_path}")
    print(
        f"改图工作流: 编辑 {d2_path} → python3 scripts/d2-workbench.py render {d2_path} → "
        f"python3 scripts/d2-workbench.py sync {args.md} {d2_path} {args.index or 1}"
    )
    if render_and_verify(d2_path, stem):
        print("✅ 提取 + 校验通过，可以开始修改")


def cmd_render(args):
    stem = os.path.splitext(args.file)[0]
    render_and_verify(args.file, stem, want_png=True)


def cmd_sync(args):
    if not os.path.exists(args.file):
        err(f"{args.file} 不存在")
    new_d2 = open(args.file, encoding="utf-8").read().rstrip("\n")
    blocks, content = extract_blocks(args.md)
    n = (args.index or 1) - 1
    if n >= len(blocks):
        err(f"{args.md} 只有 {len(blocks)} 个 d2 块，图序号 {args.index} 越界")

    # 1. 替换第 N 个代码块内容（保持 ```d2 ... ``` 结构）
    old_block = blocks[n]
    content = content.replace(
        "```d2\n" + old_block + "```", "```d2\n" + new_d2 + "```", 1
    )

    # 2. 重新定位替换后的第 N 个块，删除其后的旧 fallback
    blocks2 = list(D2_BLOCK_RE.finditer(content))
    blk = blocks2[n]
    m = FALLBACK_RE.search(content, blk.end())
    if m:
        content = content[: m.start()] + content[m.end() :]

    # 3. 渲染新 SVG → base64 fallback，插入到该块之后
    stem = os.path.join(
        os.path.dirname(args.md), os.path.splitext(os.path.basename(args.file))[0]
    )
    svg = stem + ".svg"
    check_d2()
    run(["d2", args.file, svg], f"d2 渲染 → {os.path.basename(svg)}")
    if not check_viewbox(svg):
        err("viewBox 异常，已中止回写（防止把坏图嵌入文档）")
    b64 = base64.b64encode(open(svg, encoding="utf-8").read().encode()).decode()
    fallback = (
        f"\n<!-- D2 渲染 Fallback SVG -->\n"
        f'<img src="data:image/svg+xml;base64,{b64}" '
        f'alt="容器图（D2 渲染）" style="max-width:100%;height:auto;" />\n'
    )
    blocks3 = list(D2_BLOCK_RE.finditer(content))
    blk3 = blocks3[n]
    content = content[: blk3.end()] + fallback + content[blk3.end() :]

    open(args.md, "w", encoding="utf-8").write(content)
    print(
        f"✅ 已同步回 {args.md}（第 {args.index or 1} 个 d2 块 + fallback 已更新，仅 1 份）"
    )
    print(f"   fallback 数量: {content.count('D2 渲染 Fallback SVG')}")


def main():
    p = argparse.ArgumentParser(description="C4 Container Diagram 图编辑工作台")
    sub = p.add_subparsers(dest="mode", required=True)

    pe = sub.add_parser("extract", help="从 Markdown 提取 d2 块到工作区（含渲染+校验）")
    pe.add_argument("md")
    pe.add_argument("index", nargs="?", type=int, help="图序号（默认 1）")
    pe.add_argument("--out", default=".", help="工作区目录（默认当前目录）")

    pr = sub.add_parser("render", help="渲染工作区 .d2 → .svg/.png + 校验（改图迭代）")
    pr.add_argument("file")

    ps = sub.add_parser(
        "sync", help="把工作区 .d2 同步回 Markdown（代码块 + fallback）"
    )
    ps.add_argument("md")
    ps.add_argument("file")
    ps.add_argument("index", nargs="?", type=int, help="图序号（默认 1）")

    args = p.parse_args()
    if args.mode == "extract":
        cmd_extract(args)
    elif args.mode == "render":
        cmd_render(args)
    elif args.mode == "sync":
        cmd_sync(args)


if __name__ == "__main__":
    main()
