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
D2_BLOCK_RE = re.compile(r"```d2\n(.*?)\n```", re.DOTALL)
FALLBACK_RE = re.compile(r"\n<!-- D2 渲染 Fallback SVG.*?/>\n", re.DOTALL)
MALFORMED_RE = re.compile(r"```d2\n.*?```", re.DOTALL)


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
    content = open(md_path, encoding="utf-8").read()
    # 加固：闭合围栏必须独占一行；粘连 `}```` 直接报错而非静默匹配
    malformed_cnt = len(MALFORMED_RE.findall(content))
    blocks = D2_BLOCK_RE.findall(content)
    if malformed_cnt != len(blocks):
        err(
            f"{md_path} 存在围栏粘连（闭合 ``` 未独占一行，如 `}}````），已拒绝处理，请修复围栏换行"
        )
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


def render_and_verify(d2_path, out_stem, want_png=False):
    """渲染 .d2 → .svg(+.png, 仅显式 --png) + verify-svg.py + viewBox 检查。"""
    check_d2()
    svg = out_stem + ".svg"
    run(["d2", d2_path, svg], f"d2 渲染 → {os.path.basename(svg)}")
    ok = check_viewbox(svg)
    png = None
    if want_png and shutil.which("sips"):
        png = out_stem + ".png"
        subprocess.run(
            ["sips", "-s", "format", "png", svg, "--out", png],
            capture_output=True,
            text=True,
        )  # PNG 仅供用户看视觉，失败不阻断校验
    png_note = f" + {os.path.basename(png)}" if png and os.path.exists(png) else ""
    print(f"工作产物: {svg}{png_note}")
    r = run(["python3", VERIFY_SCRIPT, svg], "verify-svg.py 校验")
    print(f"✅ 工作产物: {svg}{png_note}")
    if r.returncode == 0 and ok:
        print("✅ verify 全部通过")
    else:
        print("⚠️ verify 未全过 / viewBox 异常，按输出修复后重跑 render")
    return r.returncode == 0 and ok


def block_names(blocks):
    """提取每个 d2 块的图名（§2 步骤 4：`# 图名`）。

    扫描块内**所有前导注释行**（含元信息块），优先匹配 `# 图名[:：]` 行，
    无则回退首行；若无任何注释则返回空串（无名块）。
    """
    names = []
    for b in blocks:
        name = ""
        for line in b.strip().split("\n"):
            line = line.strip()
            if not line.startswith("#"):
                break
            m = re.search(r"#\s*图名[:：]\s*(.+)", line)
            if m:
                name = m.group(1).strip()
                break
            if not name:
                name = line.lstrip("#").strip()
        names.append(name)
    return names


def resolve_index(args, blocks, names):
    """定位目标块序号：--name 语义匹配 > index 显式 > 列出图名让用户选"""
    if getattr(args, "name", None):
        q = args.name.lower()
        hits = [i for i, n in enumerate(names) if q in n.lower()]
        listing = "\n  ".join(f"{i + 1}: {names[i]}" for i, n in enumerate(names) if n)
        if not hits:
            err(
                f"图名 '{args.name}' 与文档所有块注释都匹配不上，文档里有：\n  {listing}"
                f"\n提示: ① 图名可能不在首行（首行是元信息块，如 `# 图标准元信息`）——"
                f"用 `# 图名: xxx` 显式标注，或改用图序号 `extract <md> N` 精确指定"
            )
        if len(hits) > 1:
            multi = "\n  ".join(f"{i + 1}: {names[i]}" for i in hits)
            err(f"图名 '{args.name}' 匹配到多个块：\n  {multi}\n请用序号精确指定")
        return hits[0]
    if args.index:
        if args.index > len(blocks):
            err(f"只有 {len(blocks)} 个 d2 块，图序号 {args.index} 越界")
        return args.index - 1
    if getattr(args, "mode", "") == "extract":
        listing = "\n  ".join(f"{i + 1}: {names[i]}" for i, n in enumerate(names) if n)
        err(
            f"请指定图序号（extract <md> N）或用 --name 图名匹配。文档 d2 块：\n  {listing}"
        )
    return 0  # sync 无 index/name 默认第 1 块


def cmd_extract(args):
    blocks, _ = extract_blocks(args.md)
    names = block_names(blocks)
    n = resolve_index(args, blocks, names)
    d2_code = blocks[n]
    out_dir = args.out or "."
    os.makedirs(out_dir, exist_ok=True)
    stem = os.path.join(
        out_dir,
        f"{os.path.splitext(os.path.basename(args.md))[0]}-fig{n + 1}",
    )
    d2_path = stem + ".d2"
    # 直接文件写入，不经 shell → 保持 \\n 字面量
    open(d2_path, "w", encoding="utf-8").write(d2_code)
    name_note = f"（{names[n]}）" if names[n] else ""
    print(f"已提取第 {n + 1} 个 d2 块{name_note} → {d2_path}")
    if not names[n]:
        print(
            f"  ⚠️ 该块无有效图名（前导注释非 `# 图名: xxx`）——建议先补 `# 图名: xxx` 再改，"
            f"便于后续语义定位（§2.1 分诊）"
        )
    print(
        f"改图工作流: 编辑 {d2_path} → python3 scripts/d2-workbench.py render {d2_path} → "
        f"python3 scripts/d2-workbench.py sync {args.md} {d2_path} {n + 1}"
    )
    if render_and_verify(d2_path, stem, want_png=getattr(args, "png", False)):
        print("✅ 提取 + 校验通过，可以开始修改")


def cmd_render(args):
    stem = os.path.splitext(args.file)[0]
    render_and_verify(args.file, stem, want_png=getattr(args, "png", False))


def cmd_sync(args):
    if not os.path.exists(args.file):
        err(f"{args.file} 不存在")
    new_d2 = open(args.file, encoding="utf-8").read().rstrip("\n")
    original_content = open(args.md, encoding="utf-8").read()
    blocks, content = extract_blocks(args.md)
    names = block_names(blocks)
    n = resolve_index(args, blocks, names)
    name_note = f"（{names[n]}）" if names[n] else ""
    if not names[n]:
        print(
            f"  ⚠️ 目标块无图名（首行无注释）——建议先补 `# 图名` 再改，"
            f"便于后续语义定位（§2.1 分诊）"
        )

    before = len(blocks)
    matches = list(D2_BLOCK_RE.finditer(content))
    m = matches[n]
    content = content[: m.start()] + "```d2\n" + new_d2 + "\n```" + content[m.end() :]

    after = len(list(D2_BLOCK_RE.finditer(content)))
    if after != before:
        err(f"同步后 d2 块数 {after} ≠ 替换前 {before}——修改不应增删代码块，已中止回写")

    blocks2 = list(D2_BLOCK_RE.finditer(content))
    blk = blocks2[n]
    fm = FALLBACK_RE.search(content, blk.end())
    if fm:
        content = content[: fm.start()] + content[fm.end() :]

    fallback_mode = getattr(args, "fallback", "none")
    if getattr(args, "remove_fallback", False):
        fallback_mode = "none"

    if fallback_mode == "img":
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
        fb_cnt = content.count("D2 渲染 Fallback SVG")
    else:
        fb_cnt = content.count("D2 渲染 Fallback SVG")

    open(args.md, "w", encoding="utf-8").write(content)

    try:
        v_blocks, _ = extract_blocks(args.md)
        if len(v_blocks) != before:
            raise RuntimeError(f"回读校验：块数 {len(v_blocks)} ≠ 期望 {before}")
        verify_d2 = v_blocks[n]
        stem_v = os.path.join(
            os.path.dirname(args.md), os.path.splitext(os.path.basename(args.file))[0]
        )
        tmp_d2 = stem_v + ".verify.d2"
        tmp_svg = stem_v + ".verify.svg"
        open(tmp_d2, "w", encoding="utf-8").write(verify_d2)
        run(["d2", "validate", tmp_d2], "回读校验 d2 validate")
        run(["d2", tmp_d2, tmp_svg], "回读校验 d2 渲染")
        if not check_viewbox(tmp_svg):
            raise RuntimeError("回读校验 viewBox 异常")
        run(["python3", VERIFY_SCRIPT, tmp_svg], "回读校验 verify-svg")
        for p in (tmp_d2, tmp_svg):
            try:
                os.remove(p)
            except OSError:
                pass
    except SystemExit as e:
        open(args.md, "w", encoding="utf-8").write(original_content)
        raise
    except Exception as e:
        open(args.md, "w", encoding="utf-8").write(original_content)
        err(f"回读校验失败已回滚：{e}")

    if fallback_mode == "img":
        print(
            f"✅ 已同步回 {args.md}（第 {n + 1} 个 d2 块{name_note} + fallback 已更新，仅 1 份）"
        )
    else:
        print(f"✅ 已同步回 {args.md}（第 {n + 1} 个 d2 块{name_note}，无 fallback）")
    print(f"   fallback 数量: {fb_cnt}")
    print("   回读校验: PASS（extract → validate → render → verify-svg → viewBox）")


def cmd_clean_fallback(args):
    content = open(args.md, encoding="utf-8").read()
    original = content
    new_content, n = FALLBACK_RE.subn("", content)
    if n == 0:
        print(f"{args.md} 无 fallback，已干净")
        return
    open(args.md, "w", encoding="utf-8").write(new_content)
    print(f"✅ 已清理 {args.md} 的 {n} 个 fallback")


def main():
    p = argparse.ArgumentParser(description="C4 Container Diagram 图编辑工作台")
    sub = p.add_subparsers(dest="mode", required=True)

    pe = sub.add_parser("extract", help="从 Markdown 提取 d2 块到工作区（含渲染+校验）")
    pe.add_argument("md")
    pe.add_argument("index", nargs="?", type=int, help="图序号（默认需指定）")
    pe.add_argument("--name", help="按图名语义匹配（前导注释，中英任一）")
    pe.add_argument("--out", default=".", help="工作区目录（默认当前目录）")
    pe.add_argument(
        "--png",
        action="store_true",
        help="额外生成 PNG（默认不生成，仅看视觉效果时用）",
    )

    pr = sub.add_parser("render", help="渲染工作区 .d2 → .svg/.png + 校验（改图迭代）")
    pr.add_argument("file")
    pr.add_argument(
        "--png",
        action="store_true",
        help="额外生成 PNG（默认不生成，仅看视觉效果时用）",
    )

    ps = sub.add_parser(
        "sync", help="把工作区 .d2 同步回 Markdown（代码块 + 按需 fallback）"
    )
    ps.add_argument("md")
    ps.add_argument("file")
    ps.add_argument("index", nargs="?", type=int, help="图序号（默认 1）")
    ps.add_argument("--name", help="按图名语义匹配（首行注释，中英任一）")
    ps.add_argument(
        "--fallback",
        choices=["none", "img"],
        default="none",
        help="fallback 模式：none=不插入（默认，原生支持 d2 的渲染器）/ img=嵌入 base64 img",
    )
    ps.add_argument(
        "--remove-fallback",
        action="store_true",
        help="等同 --fallback none，并清理已有 fallback",
    )

    pc = sub.add_parser("clean-fallback", help="清理文档中所有 D2 fallback img")
    pc.add_argument("md", help="目标 Markdown 文件")

    args = p.parse_args()
    if args.mode == "extract":
        cmd_extract(args)
    elif args.mode == "render":
        cmd_render(args)
    elif args.mode == "sync":
        cmd_sync(args)
    elif args.mode == "clean-fallback":
        cmd_clean_fallback(args)


if __name__ == "__main__":
    main()
