#!/usr/bin/env python3
"""C4 Container Diagram 渲染验收脚本 — SVG 坐标确定性验证

用法: python3 verify-svg.py <diagram.svg> [--source file.d2]
输出: 每对"父容器 → 直接子容器"的 4 边超界数值 + 单列容器左右等宽判定 + 圆角(rx)检查
     + 文字溢出检测（铁律4）+ 嵌套深度报告（--source 时输出 .d2 真实层级树）
方法论: 见 SKILL.md §7.1

判断规则:
- 超界: 子容器任一 4 边超出父容器边界 > 容差(stroke-width/2 + 0.5)
- 等宽: 单列容器(竖条, grid-columns:1, 不设 width 由 ELK 自动包裹) 内所有直接子容器 x 相同 → 左右距相等
- 圆角: 图形节点(排除画布背景/箭头文字标签/span徽章) 都应有 rx
- 文字溢出: 文本估算宽 > 宿主容器宽 + 容差(TEXT_OVERFLOW_TOL) → 铁律4 文本完整
- 嵌套深度: 几何包含计数; --source 时与 .d2 缩进层级对比, 不一致告警

已知排除项:
- 画布背景(面积最大, rx=0 正常; D2 可能生成重复画布 rect, 按面积排除所有)
- 箭头文字标签背景(h<40, D2 边标签固有行为)
- grid-column-span 徽章(带数字文本的小直角矩形, D2 跨列标记)
"""

import re
import sys
from xml.etree import ElementTree as ET

NS = {"svg": "http://www.w3.org/2000/svg"}


def parse_rects(path):
    """解析 SVG 所有 rect, 返回 [(x, y, w, h, stroke_width, rx)]"""
    tree = ET.parse(path)
    root = tree.getroot()
    rects = []
    for rect in root.iter(f"{{http://www.w3.org/2000/svg}}rect"):
        x = float(rect.get("x", 0))
        y = float(rect.get("y", 0))
        w = float(rect.get("width", 0))
        h = float(rect.get("height", 0))
        style = rect.get("style", "")
        sw = 1.0
        m = re.search(r"stroke-width:([\d.]+)", style)
        if m:
            sw = float(m.group(1))
        rx = rect.get("rx", None)
        rects.append((x, y, w, h, sw, rx))
    return rects


def parse_texts(path):
    """解析 SVG 所有 text 元素 → [(x, y, label)]，用于定位无圆角 rect 对应节点"""
    tree = ET.parse(path)
    root = tree.getroot()
    texts = []
    for text in root.iter(f"{{http://www.w3.org/2000/svg}}text"):
        x = float(text.get("x", 0))
        y = float(text.get("y", 0))
        label = "".join(text.itertext()).strip()
        texts.append((x, y, label))
    return texts


# 文字溢出检测：铁律 4「文本完整」的脚本强制项（P0-1）


def est_text_width(text, font_size):
    """估算一行文本渲染宽度（D2 节点 label font-size=16px，层容器 24px）。"""
    w = 0.0
    for ch in text:
        cp = ord(ch)
        if cp >= 0x2E80 or (0x1100 <= cp <= 0x11FF) or (0xAC00 <= cp <= 0xD7A3):
            w += font_size
        elif ch in " \t":
            w += font_size * 0.3
        else:
            w += font_size * 0.55 if cp < 0x3000 else font_size
    return w


def parse_text_geo(path):
    """解析 SVG text 元素（含多行 tspan）→ 每元素的行列表与度量。

    返回 [{cx, lines:[(x,y,text)], font_size, label}]。
    cx = text-anchor:middle 锚点中心 x；多行时每行 tspan 均为 middle、x 相同。
    """
    tree = ET.parse(path)
    root = tree.getroot()
    out = []
    for text in root.iter(f"{{http://www.w3.org/2000/svg}}text"):
        style = text.get("style", "")
        fs = 16.0
        m = re.search(r"font-size:([\d.]+)px", style)
        if m:
            fs = float(m.group(1))
        # 锚点：默认 middle（D2 节点/容器 label）
        anchor = "middle"
        am = re.search(r"text-anchor:(\w+)", style)
        if am:
            anchor = am.group(1)
        x0 = float(text.get("x", 0))
        y0 = float(text.get("y", 0))
        spans = list(text)
        if spans and all(s.tag.endswith("tspan") for s in spans):
            lines = []
            for sp in spans:
                lx = float(sp.get("x", 0)) if sp.get("x") is not None else x0
                ly = float(sp.get("y", 0)) if sp.get("y") is not None else y0
                lines.append((lx, ly, "".join(sp.itertext())))
        else:
            lines = [(x0, y0, "".join(text.itertext()).strip())]
        label = " | ".join(t for _, _, t in lines if t)
        out.append(
            {
                "cx": x0,
                "y": y0,
                "lines": lines,
                "font_size": fs,
                "anchor": anchor,
                "label": label,
            }
        )
    return out


def is_edge_label(text_geo, rects):
    """判断 text 是否为箭头边标签（非容器内 label）。

    箭头边标签由 D2 生成一个 h<40 的小背景 rect 承载（实测 h≈21），而容器
    label 的宿主 rect 是容器本身（h 远大于 40）。据此区分，避免箭头上的
    文字（如层间关系标签「支撑」）被误判为容器文字溢出。
    """
    cx = text_geo["cx"]
    cy = text_geo["y"]
    for r in rects:
        rx, ry, rw, rh, _, rrx = r
        if rh >= 40 or (rrx is not None and float(rrx) > 0):
            continue
        if not (rx - 2 <= cx <= rx + rw + 2):
            continue
        if not (ry - 2 <= cy <= ry + rh + 2):
            continue
        return True
    return False


def find_host_rect(text_geo, rects):
    """找承载该文本的最小容器 rect（取文本锚点 cx 与 y 落于其内的最小 rect）。"""
    if is_edge_label(text_geo, rects):
        return None
    cx = text_geo["cx"]
    ys = [ly for _, ly, _ in text_geo["lines"]]
    top = min(ys)
    n = len(text_geo["lines"])
    bottom = top + n * text_geo["font_size"] * 1.1
    all_area = max((r[2] * r[3] for r in rects), default=0)
    best, best_area = None, None
    for r in rects:
        rx, ry, rw, rh, _, rrx = r
        if rw * rh >= all_area - 1:  # 画布背景
            continue
        if rh < 40:  # 箭头边标签背景
            continue
        if rrx is not None and float(rrx) > 0 and rw > 300:  # 仅排除画布，保留圆角容器
            pass
        if not (rx - 1 <= cx <= rx + rw + 1):
            continue
        if not (ry - 1 <= top and bottom <= ry + rh + 1):
            continue
        if best_area is None or rw * rh < best_area:
            best, best_area = r, rw * rh
    return best


# 文字溢出容差（px）。宽度系数受字体渲染影响，8-10px 而非 0。
TEXT_OVERFLOW_TOL = 10

# 非容器 key（容器属性，缩进解析时排除）
_NON_CONTAINER_KEYS = {
    "vars",
    "classes",
    "style",
    "label",
    "width",
    "height",
    "grid-rows",
    "grid-columns",
    "grid-gap",
    "fill",
    "stroke",
    "font-color",
    "stroke-width",
    "border-radius",
    "class",
    "shape",
    "direction",
    "icon",
    "near",
    "z-index",
}
_NON_CONTAINER_PREFIX = ("grid-",)


def parse_d2_containers(path):
    """按 .d2 缩进解析容器层级 → [{name, depth, parent}]（仅保留 true 容器 key）。

    容器判定：`key: {` 形式；排除 vars/classes/style 及 width/grid-* 等属性 key。
    """
    raw = open(path, encoding="utf-8").read()
    nodes = []
    stack = []
    skip = None
    for line in raw.split("\n"):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(line) - len(line.lstrip())
        if stripped.endswith(":") and stripped[:-1] in ("vars", "classes"):
            stack.append((indent, stripped[:-1]))
            skip = indent
            continue
        if skip is not None:
            if indent <= skip:
                skip = None
            else:
                continue
        m = re.match(r"^([^:#{}\s][^:{]*?)\s*:\s*\{", stripped)
        if not m:
            continue
        name = m.group(1).strip()
        if name in _NON_CONTAINER_KEYS or name.startswith(_NON_CONTAINER_PREFIX):
            continue
        while stack and stack[-1][0] >= indent:
            stack.pop()
        parent = stack[-1][1] if stack else None
        nodes.append({"name": name, "depth": len(stack), "parent": parent})
        stack.append((indent, name))
    return nodes


def build_child_map(nodes):
    child_map = {}
    for n in nodes:
        p = n["parent"]
        if p is not None:
            child_map.setdefault(p, []).append(n["name"])
    return child_map


def find_label(texts, cx, cy):
    """在 rect 中心附近找最近的 label 文本（定位节点名）"""
    best, best_dist = None, 1e9
    for x, y, label in texts:
        d = abs(x - cx) + abs(y - cy)
        if d < best_dist:
            best, best_dist = label, d
    return best if best_dist < 100 else None


def is_span_badge(rect, texts):
    """判断是否为 grid-column-span 徽章（D2 跨列数标记: 小直角矩形 + 数字文本）"""
    x, y, w, h, _, rx = rect
    if rx is not None and float(rx) > 0:
        return False
    if w > 100 or h > 100:  # 徽章通常很小
        return False
    # 中心附近是否有纯数字文本（如 "2"）
    cx, cy = x + w / 2, y + h / 2
    for tx, ty, label in texts:
        if label.isdigit() and abs(tx - cx) < 30 and abs(ty - cy) < 30:
            return True
    return False


def check_overlap(c, k, tol):
    """检查子容器 k 是否超父容器 c 边界"""
    cx, cy, cw, ch, _, _ = c
    kx, ky, kw, kh, _, _ = k
    over = {
        "左超": cx - kx,
        "右超": (kx + kw) - (cx + cw),
        "上超": cy - ky,
        "下超": (ky + kh) - (cy + ch),
    }
    fails = {k: v for k, v in over.items() if v > tol}
    return over, fails


def _rect_depth(r, containers):
    """计算容器 r 被嵌套的层数（被多少个其他容器几何包含）。"""
    rx, ry, rw, rh, _, _ = r
    depth = 0
    for o in containers:
        if o is r:
            continue
        ox, oy, ow, oh, _, _ = o
        if ox <= rx and rx + rw <= ox + ow + 1 and oy <= ry and ry + rh <= oy + oh + 1:
            depth += 1
    return depth


def _report_source_layers(source, containers, texts, depth_by_rect):
    """用 --source 的 .d2 缩进层级校验几何嵌套判定，不一致时告警（P8）。"""
    nodes = parse_d2_containers(source)
    d2_max = max((n["depth"] for n in nodes), default=0)
    geom_max = max(depth_by_rect.values(), default=0)
    if d2_max != geom_max:
        print(
            f"  ⚠️ [层级不一致] 几何判定最大嵌套 {geom_max} 层 ≠ .d2 缩进 {d2_max} 层——"
            f"深嵌套下几何推断可能误判（P8），以 .d2 源码层级为准"
        )
    # 输出 .d2 真实层级树
    child_map = build_child_map(nodes)
    roots = [n["name"] for n in nodes if n["parent"] is None]

    def walk(name, depth):
        kids = child_map.get(name, [])
        if not kids:
            return
        print("    " * depth + f"{name} ({len(kids)} 子)")
        for k in kids:
            walk(k, depth + 1)

    print("  · .d2 容器层级: ")
    for r in roots:
        walk(r, 1)


def main():
    argv = sys.argv[1:]
    source = None
    if "--source" in argv:
        idx = argv.index("--source")
        if idx + 1 >= len(argv):
            print("用法: python3 verify-svg.py <diagram.svg> [--source file.d2]")
            sys.exit(1)
        source = argv[idx + 1]
        del argv[idx : idx + 2]
    if not argv:
        print("用法: python3 verify-svg.py <diagram.svg> [--source file.d2]")
        sys.exit(1)
    path = argv[0]
    rects = parse_rects(path)
    texts = parse_texts(path)
    if not rects:
        print(f"{path}: 未找到任何 rect")
        sys.exit(1)

    # 画布背景 = 面积最大 rect（D2 可能生成重复画布 rect，面积相同均需排除）
    outer_area = max(r[2] * r[3] for r in rects) if rects else 0
    containers = [r for r in rects if r[2] * r[3] < outer_area and r[2] >= 100]

    text_geo_list = parse_text_geo(path)
    over_cnt = 0
    eq_fail = 0
    eq_pass = 0
    text_of = 0
    print(f"=== {path} 验收 ===")
    print(f"容器数: {len(containers)}")

    # 圆角检查: 排除画布背景(面积最大, rx=0 正常) + 箭头文字标签背景(h<40) + span 徽章
    bg_area = outer_area
    no_rx = []
    for r in rects:
        if r[2] * r[3] >= bg_area - 1:  # 画布背景
            continue
        if r[3] < 40:  # 箭头文字标签背景
            continue
        if r[5] is not None and float(r[5]) > 0:  # 有圆角
            continue
        if is_span_badge(r, texts):  # grid-column-span 徽章
            continue
        no_rx.append(r)
    if no_rx:
        print(f"  [圆角] {len(no_rx)} 个图形无圆角(rx) — 违反 §4.8 铁律:")
        for r in no_rx:
            cx, cy = r[0] + r[2] / 2, r[1] + r[3] / 2
            label = find_label(texts, cx, cy)
            loc = f"（疑似节点: {label}）" if label else ""
            print(f"    rect(x={r[0]:.0f},y={r[1]:.0f},w={r[2]:.0f},h={r[3]:.0f}){loc}")
            print(
                f"    → 修复: 该节点容器补 style.border-radius（外层 wrapper 用 16，层/分区用 8~12）"
            )
    else:
        print(f"  [圆角] 全部图形有圆角 ✓")

    for c in containers:
        cx, cy, cw, ch, csw, _ = c
        tol = csw / 2 + 0.5
        cands = [
            k
            for k in rects
            if k is not c
            and k[0] >= cx - 1
            and k[0] + k[2] <= cx + cw + 1
            and k[1] >= cy - 1
            and k[1] + k[3] <= cy + ch + 1
            and k[2] < cw - 1
        ]
        direct = []
        for k in cands:
            contained = any(
                o != k
                and o[0] <= k[0]
                and k[0] + k[2] <= o[0] + o[2] + 1
                and o[1] <= k[1]
                and k[1] + k[3] <= o[1] + o[3] + 1
                for o in cands
            )
            if not contained:
                direct.append(k)

        for k in direct:
            if k[2] < 5 or k[3] < 5:
                continue
            over, fails = check_overlap(c, k, tol)
            if fails:
                over_cnt += 1
                details = " ".join(f"{k}={v:.1f}" for k, v in fails.items())
                cx_k, cy_k = k[0] + k[2] / 2, k[1] + k[3] / 2
                label = find_label(texts, cx_k, cy_k)
                loc = f"（节点: {label}）" if label else ""
                print(
                    f"  [超界] 父(x={cx:.0f}~{cx + cw:.0f},y={cy:.0f}) 子(x={k[0]:.0f}~{k[0] + k[2]:.0f},w={k[2]:.0f}){loc} {details}px"
                )
            # 单列容器等宽检查: 仅当父容器所有 direct 子容器 x 坐标相同（真正单列竖排）
            # 多列容器的第 1 列也是 x≈父x+60，不能据此判定单列（否则误报"不等宽"）
            xs = {k[0] for k in direct}
            if len(xs) == 1 and abs(list(xs)[0] - (cx + 60)) < 15:
                for k in direct:
                    if k[2] < 5 or k[3] < 5:
                        continue
                    left = k[0] - cx
                    right = (cx + cw) - (k[0] + k[2])
                    if abs(left - right) < 3:
                        eq_pass += 1
                    else:
                        eq_fail += 1
                        print(
                            f"  [不等宽] 单列容器 父w={cw:.0f} 子w={k[2]:.0f} 左距={left:.0f} 右距={right:.0f} → 修复: 若单列容器有固定宽, 子width = 父宽−120 (实测 v0.8.1, §6.13 B2); 若为独立竖条则不设 width 让 ELK 自动包裹 (§6.13 B1)"
                        )

    # 嵌套层级报告（P8：输出各容器深度 + 直接子容器数，便于深嵌套归因）
    depth_by_rect = {}
    for c in containers:
        depth = _rect_depth(c, containers)
        depth_by_rect[id(c)] = depth
    max_depth = max(depth_by_rect.values(), default=0)
    print(f"---")
    print(f"嵌套深度: 最多 {max_depth} 层")
    if source:
        _report_source_layers(source, containers, texts, depth_by_rect)

    # 文字溢出检测（铁律 4 文本完整，P0-1）
    for tg in text_geo_list:
        host = find_host_rect(tg, rects)
        if host is None:
            continue
        hx, hy, hw, hh, _, _ = host
        anchor = tg["anchor"]
        max_w = 0.0
        for lx, ly, t in tg["lines"]:
            if not t:
                continue
            w = est_text_width(t, tg["font_size"])
            if w > max_w:
                max_w = w
        # text-anchor: middle → 左右各 half；start → 从 cx 向右
        if anchor == "start":
            left_edge = tg["cx"]
        elif anchor == "end":
            left_edge = tg["cx"] - max_w
        else:
            left_edge = tg["cx"] - max_w / 2
        right_edge = left_edge + max_w
        overflow_l = left_edge < (hx - TEXT_OVERFLOW_TOL)
        overflow_r = right_edge > (hx + hw + TEXT_OVERFLOW_TOL)
        if overflow_l or overflow_r:
            text_of += 1
            over = f"左超{left_edge - hx:.0f} " if overflow_l else ""
            over += f"右超{right_edge - (hx + hw):.0f}" if overflow_r else ""
            print(
                f"  [文字溢出] 容器(x={hx:.0f}~{hx + hw:.0f},w={hw:.0f}) label='{tg['label'][:40]}' 估宽={max_w:.0f} {over.strip()}px → 修复: label 用 \\n 拆行（每行≤8字）或缩 label, §6.17"
            )

    print(f"---")
    print(f"超界: {over_cnt}")
    print(f"单列等宽: {eq_pass}✓ / {eq_fail}✗")
    print(f"文字溢出: {text_of}")
    if over_cnt == 0 and eq_fail == 0 and not no_rx and text_of == 0:
        print("✅ 全部通过")
    else:
        print("❌ 有超界/不等宽/无圆角/文字溢出，对照 §6.13 公式修复")
        sys.exit(1)


if __name__ == "__main__":
    main()
