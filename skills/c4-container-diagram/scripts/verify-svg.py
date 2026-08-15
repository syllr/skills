#!/usr/bin/env python3
"""C4 Container Diagram 渲染验收脚本 — SVG 坐标确定性验证

用法: python3 verify-svg.py <diagram.svg>
输出: 每对"父容器 → 直接子容器"的 4 边超界数值 + 单列容器左右等宽判定 + 圆角(rx)检查
方法论: 见 SKILL.md §7.1

判断规则:
- 超界: 子容器任一 4 边超出父容器边界 > 容差(stroke-width/2 + 0.5)
- 等宽: 单列容器(grid-columns:1 靠左 x=父x+60) 子容器 左距==右距
- 圆角: 图形节点(排除画布背景/箭头文字标签/span徽章) 都应有 rx

已知排除项:
- 画布背景(面积最大, rx=0 正常)
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


def main():
    if len(sys.argv) < 2:
        print("用法: python3 verify-svg.py <diagram.svg>")
        sys.exit(1)
    path = sys.argv[1]
    rects = parse_rects(path)
    texts = parse_texts(path)
    if not rects:
        print(f"{path}: 未找到任何 rect")
        sys.exit(1)

    # 画布背景 = 面积最大 rect
    outer = max(rects, key=lambda r: r[2] * r[3])
    containers = [r for r in rects if r is not outer and r[2] >= 100]

    over_cnt = 0
    eq_fail = 0
    eq_pass = 0
    print(f"=== {path} 验收 ===")
    print(f"容器数: {len(containers)}")

    # 圆角检查: 排除画布背景(面积最大, rx=0 正常) + 箭头文字标签背景(h<40) + span 徽章
    bg_area = outer[2] * outer[3]
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
            # 单列容器等宽检查: 子 x ≈ 父x+60 (左内边距)
            if abs(k[0] - (cx + 60)) < 15:
                left = k[0] - cx
                right = (cx + cw) - (k[0] + k[2])
                if abs(left - right) < 3:
                    eq_pass += 1
                else:
                    eq_fail += 1
                    print(
                        f"  [不等宽] 单列容器 父w={cw:.0f} 子w={k[2]:.0f} 左距={left:.0f} 右距={right:.0f} (应设 子width=父宽-120)"
                    )

    print(f"---")
    print(f"超界: {over_cnt}")
    print(f"单列等宽: {eq_pass}✓ / {eq_fail}✗")
    if over_cnt == 0 and eq_fail == 0 and not no_rx:
        print("✅ 全部通过")
    else:
        print("❌ 有超界/不等宽/无圆角，对照 §6.13 公式修复")
        sys.exit(1)


if __name__ == "__main__":
    main()
