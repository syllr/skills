#!/usr/bin/env python3
# split_openapi.py —— OpenAPI 多文件拆分器模板（框架无关；引导时复制到项目 scripts/）
#
# 用途：把单文件 OpenAPI 契约按业务域拆为 openapi.yaml（只承载元信息与 $ref）+ paths/<domain>.yaml + components/*。
# 口径（推荐，见 references/export-mechanics.md §2）：components 全量收敛 components/，paths 文件零本地 components。
# 用法：
#   python scripts/split_openapi.py --in /tmp/openapi-export.json --out /tmp/openapi-export/ \
#       --domain-map '{"auth":["/auth/*"],"audit-project":["/projects*","/audit-*"]}'
#   （不给 --domain-map 时按 operation 的首个 tag 作为域名）
# 说明：这是模板，非成品——域映射按项目业务域改写后使用；产物结构以 docs/L3/API.md §1 为准。
# 拆分为无损变换：内部 $ref（#/components/...）一律重写为指向 components/ 的外部相对 $ref，
# 保证拆分后仍可 redocly bundle/lint 通过（悬空 $ref 会报错）。

from __future__ import annotations

import argparse
import fnmatch
import json
from collections import defaultdict
from pathlib import Path

try:
    import yaml
except ModuleNotFoundError:  # pragma: no cover
    raise SystemExit("需要 PyYAML：pip install pyyaml")

METHODS = ("get", "post", "put", "patch", "delete", "options", "head", "trace")


def load_spec(path: Path):
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() in (".yaml", ".yml"):
        return yaml.safe_load(text)
    return json.loads(text)


def domain_of(path_item: dict, path_key: str, domain_map: dict[str, list[str]]) -> str:
    """判定一个 path 归属的域名：先按显式映射 glob，再按首个 tag，最后兜底 'default'。"""
    for domain, patterns in domain_map.items():
        if any(fnmatch.fnmatch(path_key, pat) for pat in patterns):
            return domain
    for method in METHODS:
        op = path_item.get(method)
        if isinstance(op, dict) and op.get("tags"):
            return str(op["tags"][0])
    return "default"


def collect_refs(node, acc: set[str]) -> None:
    """递归收集所有 $ref 字符串。"""
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "$ref" and isinstance(v, str):
                acc.add(v)
            else:
                collect_refs(v, acc)
    elif isinstance(node, list):
        for item in node:
            collect_refs(item, acc)


def rewrite_refs(node, resolver):
    """就地重写 $ref：resolver(ref) 返回新 ref 或 None（不改）。递归覆盖 dict/list。"""
    if isinstance(node, dict):
        for k in list(node.keys()):
            if k == "$ref" and isinstance(node[k], str):
                new = resolver(node[k])
                if new is not None:
                    node[k] = new
            else:
                rewrite_refs(node[k], resolver)
    elif isinstance(node, list):
        for item in node:
            rewrite_refs(item, resolver)


def main() -> int:
    parser = argparse.ArgumentParser(description="拆分 OpenAPI 单文件为多文件结构")
    parser.add_argument(
        "--in", dest="src", required=True, help="输入单文件（导出的契约）"
    )
    parser.add_argument(
        "--out", dest="dst", required=True, help="输出目录（建议先落临时目录）"
    )
    parser.add_argument(
        "--domain-map", default="{}", help="域名→路径 glob 列表的 JSON（可选）"
    )
    args = parser.parse_args()

    spec = load_spec(Path(args.src))
    domain_map = json.loads(args.domain_map)
    out = Path(args.dst)
    (out / "paths").mkdir(parents=True, exist_ok=True)
    (out / "components").mkdir(parents=True, exist_ok=True)

    paths = spec.get("paths") or {}
    components = spec.get("components") or {}

    # ---- 1. paths 按域分桶 ----
    by_domain: dict[str, dict] = defaultdict(dict)
    path_domain: dict[str, str] = {}
    for path_key, path_item in paths.items():
        d = domain_of(path_item, path_key, domain_map)
        by_domain[d][path_key] = path_item
        path_domain[path_key] = d

    # ---- 2. components 按「被哪个域的 paths 引用」归属；未被引用的归 default ----
    def components_refs_of(paths_subset: dict) -> set[str]:
        refs: set[str] = set()
        collect_refs(paths_subset, refs)
        return refs

    comp_domain: dict[tuple[str, str], str] = {}  # (section, name) -> domain
    for d, subset in by_domain.items():
        for ref in components_refs_of(subset):
            if ref.startswith("#/components/"):
                parts = ref[len("#/components/") :].split("/")
                if len(parts) >= 2 and parts[1] in components.get(parts[0], {}):
                    comp_domain.setdefault((parts[0], parts[1]), d)

    by_domain_comp: dict[str, dict] = defaultdict(lambda: defaultdict(dict))
    for section, items in components.items():
        if not isinstance(items, dict):
            continue
        for name, body in items.items():
            d = comp_domain.get((section, name), "default")
            by_domain_comp[d][section][name] = body

    # (section, name) -> 该 component 落在哪个域文件（用于重写 ref）
    comp_home: dict[tuple[str, str], str] = {}
    for d, sections in by_domain_comp.items():
        for section, items in sections.items():
            for name in items:
                comp_home[(section, name)] = d

    # ---- 3. 写 paths 文件（重写所有 #/components/... 为外部相对 ref） ----
    def make_resolver(from_dir: str):
        def resolver(ref: str) -> str | None:
            if not ref.startswith("#/components/"):
                return None
            parts = ref[len("#/components/") :].split("/")
            if len(parts) < 2:
                return None
            home = comp_home.get((parts[0], parts[1]))
            if home is None:
                return None
            # from_dir 为 "paths" 或 "components"：两者到 components/ 的相对前缀不同
            prefix = "../components" if from_dir == "paths" else "../components"
            return f"{prefix}/{home}.yaml#/components/{parts[0]}/{parts[1]}"

        return resolver

    counts = {}
    for d, subset in by_domain.items():
        rewrite_refs(subset, make_resolver("paths"))
        # paths 文件头注释：依据来源与边界由项目按业务域补全（此处仅留占位）
        (out / "paths" / f"{d}.yaml").write_text(
            yaml.safe_dump({"paths": subset}, allow_unicode=True, sort_keys=False),
            encoding="utf-8",
        )
        counts[d] = len(subset)

    # ---- 4. 写 components 文件（内部互相引用的 ref 也需重写） ----
    for d, sections in by_domain_comp.items():
        plain = json.loads(
            json.dumps(sections)
        )  # defaultdict → 普通 dict（PyYAML 不能序列化 defaultdict）
        rewrite_refs(plain, make_resolver("components"))
        (out / "components" / f"{d}.yaml").write_text(
            yaml.safe_dump({"components": plain}, allow_unicode=True, sort_keys=False),
            encoding="utf-8",
        )

    # ---- 5. openapi.yaml 基座：只承载元信息 + path item 级 $ref 聚合 ----
    base = {k: v for k, v in spec.items() if k not in ("paths", "components")}
    base["paths"] = {
        pk: {
            "$ref": f"./paths/{path_domain[pk]}.yaml#/paths/{pk.replace('~', '~0').replace('/', '~1')}"
        }
        for pk in paths
    }
    header = (
        "# 本文件由导出 + 拆分脚本生成，勿手工编辑；修改契约请改代码后重新导出。\n"
        "# 端点计数（须与 docs/L3/API.md §1 表一致）：\n"
    )
    tail = (
        "# paths: "
        + ", ".join(f"{d}={c}" for d, c in sorted(counts.items()))
        + f" → 合计 {sum(counts.values())}\n"
    )
    (out / "openapi.yaml").write_text(
        header
        + yaml.safe_dump(base, allow_unicode=True, sort_keys=False)
        + "\n"
        + tail,
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "ok": True,
                "out": str(out),
                "domains": counts,
                "total": sum(counts.values()),
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
