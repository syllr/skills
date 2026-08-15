#!/usr/bin/env python3
"""C4 Container Diagram 渲染验收脚本 — SVG 坐标确定性验证

用法: python3 verify-svg.py <diagram.svg>
输出: 每对"父容器 → 直接子容器"的 4 边超界数值 + 单列容器左右等宽判定
方法论: 见 SKILL.md §7.1 (超界/等宽判断)

判断规则:
- 超界: 子容器任一 4 边超出父容器边界 > 容差(stroke-width/2 + 0.5)
- 等宽: 单列容器(grid-columns:1 靠左 x=父x+60) 子容器 左距==右距
"""
import re
import sys
from xml.etree import ElementTree as ET

NS = {'svg': 'http://www.w3.org/2000/svg'}


def parse_rects(path):
    """解析 SVG 所有 rect, 返回 [(x, y, w, h, stroke_width)]"""
    tree = ET.parse(path)
    root = tree.getroot()
    rects = []
    for rect in root.iter(f'{{http://www.w3.org/2000/svg}}rect'):
        x = float(rect.get('x', 0))
        y = float(rect.get('y', 0))
        w = float(rect.get('width', 0))
        h = float(rect.get('height', 0))
        # 从 style 属性提取 stroke-width
        style = rect.get('style', '')
        sw = 1.0
        m = re.search(r'stroke-width:([\d.]+)', style)
        if m:
            sw = float(m.group(1))
        rects.append((x, y, w, h, sw))
    return rects


def check_overlap(c, k, tol):
    """检查子容器 k 是否超父容器 c 边界"""
    cx, cy, cw, ch, _ = c
    kx, ky, kw, kh, _ = k
    over = {
        '左超': cx - kx,
        '右超': (kx + kw) - (cx + cw),
        '上超': cy - ky,
        '下超': (ky + kh) - (cy + ch),
    }
    fails = {k: v for k, v in over.items() if v > tol}
    return over, fails


def main():
    if len(sys.argv) < 2:
        print('用法: python3 verify-svg.py <diagram.svg>')
        sys.exit(1)
    path = sys.argv[1]
    rects = parse_rects(path)
    if not rects:
        print(f'{path}: 未找到任何 rect')
        sys.exit(1)

    # 画布背景 = 面积最大 rect
    outer = max(rects, key=lambda r: r[2] * r[3])
    containers = [r for r in rects if r is not outer and r[2] >= 100]

    over_cnt = 0
    eq_fail = 0
    eq_pass = 0
    print(f'=== {path} 验收 ===')
    print(f'容器数: {len(containers)}')

    for c in containers:
        cx, cy, cw, ch, csw = c
        tol = csw / 2 + 0.5
        # 直接子容器: 完全在父内, 不被其他子容器包含
        cands = [k for k in rects if k is not c and k[0] >= cx - 1 and
                 k[0] + k[2] <= cx + cw + 1 and k[1] >= cy - 1 and
                 k[1] + k[3] <= cy + ch + 1 and k[2] < cw - 1]
        direct = []
        for k in cands:
            contained = any(o != k and o[0] <= k[0] and k[0] + k[2] <= o[0] + o[2] + 1 and
                            o[1] <= k[1] and k[1] + k[3] <= o[1] + o[3] + 1 for o in cands)
            if not contained:
                direct.append(k)

        for k in direct:
            if k[2] < 5 or k[3] < 5:
                continue
            over, fails = check_overlap(c, k, tol)
            if fails:
                over_cnt += 1
                details = ' '.join(f'{k}={v:.1f}' for k, v in fails.items())
                print(f'  [超界] 父(x={cx:.0f}~{cx+cw:.0f},y={cy:.0f}) 子(x={k[0]:.0f}~{k[0]+k[2]:.0f},w={k[2]:.0f}) {details}px')
            # 单列容器等宽检查: 子 x ≈ 父x+60 (左内边距)
            if abs(k[0] - (cx + 60)) < 15:
                left = k[0] - cx
                right = (cx + cw) - (k[0] + k[2])
                if abs(left - right) < 3:
                    eq_pass += 1
                else:
                    eq_fail += 1
                    print(f'  [不等宽] 单列容器 父w={cw:.0f} 子w={k[2]:.0f} 左距={left:.0f} 右距={right:.0f} (应设 子width=父宽-120)')

    print(f'---')
    print(f'超界: {over_cnt}')
    print(f'单列等宽: {eq_pass}✓ / {eq_fail}✗')
    if over_cnt == 0 and eq_fail == 0:
        print('✅ 全部通过')
    else:
        print('❌ 有超界或不等宽，对照 §6.13 公式修复')
        sys.exit(1)


if __name__ == '__main__':
    main()
