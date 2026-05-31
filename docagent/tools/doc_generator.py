"""文档生成工具 - 分析代码结构并生成文档"""

import os
import re
from pathlib import Path
from typing import Optional
from .base import Tool


class ScanProjectTool(Tool):
    """扫描项目结构"""

    name = "scan_project"
    description = "扫描项目目录结构，返回文件列表和基本信息"
    parameters = {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "项目路径（默认为当前目录）",
            },
            "include_patterns": {
                "type": "array",
                "description": "要包含的文件模式，如 ['*.py', '*.js']",
                "items": {"type": "string"},
            },
        },
        "required": ["path"],
    }

    def execute(self, path: str = ".", include_patterns: Optional[list] = None) -> str:
        try:
            base = Path(path).expanduser().resolve()
            if not base.exists():
                return f"Error: 路径不存在: {path}"

            if include_patterns is None:
                include_patterns = ["*.py", "*.js", "*.ts", "*.java", "*.go", "*.rs"]

            skip_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv",
                         ".tox", "dist", "build", "target", ".idea", ".vscode"}

            result_parts = [f"项目结构: {base}\n"]
            file_count = 0

            for root, dirs, files in os.walk(base):
                dirs[:] = [d for d in dirs if d not in skip_dirs]

                rel_root = Path(root).relative_to(base)
                depth = len(rel_root.parts)

                if depth > 4:
                    continue

                for f in files:
                    if any(f.endswith(pat.replace("*", "")) or re.match(pat.replace(".", r"\.").replace("*", ".*"), f)
                        for pat in include_patterns):
                        full_path = Path(root) / f
                        rel_path = full_path.relative_to(base)
                        size = full_path.stat().st_size
                        size_str = f"{size/1024:.1f}KB" if size > 1024 else f"{size}B"
                        result_parts.append(f"  {rel_path} ({size_str})")
                        file_count += 1

                        if file_count >= 100:
                            result_parts.append("\n... (文件过多，已截断)")
                            break

            result_parts.insert(1, f"共发现 {file_count} 个文件\n")
            return "\n".join(result_parts)
        except Exception as e:
            return f"Error: {e}"


class ExtractDocFromCodeTool(Tool):
    """从代码中提取文档信息"""

    name = "extract_doc"
    description = "从代码文件中提取函数、类、模块的文档信息"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "代码文件路径",
            },
        },
        "required": ["file_path"],
    }

    def execute(self, file_path: str) -> str:
        try:
            p = Path(file_path).expanduser().resolve()
            if not p.exists():
                return f"Error: 文件不存在: {file_path}"

            content = p.read_text(encoding="utf-8", errors="ignore")
            ext = p.suffix.lower()

            if ext == ".py":
                return self._extract_python(content, str(p))
            elif ext in [".js", ".ts", ".jsx", ".tsx"]:
                return self._extract_js(content, str(p))
            elif ext in [".java", ".go", ".rs"]:
                return self._extract_generic(content, str(p))
            else:
                return f"Unsupported file type: {ext}"
        except Exception as e:
            return f"Error: {e}"

    def _extract_python(self, content: str, file_path: str) -> str:
        result = [f"# {file_path}\n"]
        lines = content.split("\n")
        in_docstring = False
        docstring_content = []
        current_func = None

        for i, line in enumerate(lines, 1):
            stripped = line.strip()

            if stripped.startswith('"""') or stripped.startswith("'''"):
                if '"""' in stripped:
                    quote = '"""'
                else:
                    quote = "'''"

                count = stripped.count(quote)
                if count >= 2:
                    docstring_content.append(stripped.split(quote)[1])
                    result.append(f"  {i}: {current_func or 'module'}: {docstring_content[-1][:100]}")
                    docstring_content = []
                else:
                    in_docstring = True
                    parts = stripped.split(quote, 1)
                    if len(parts) > 1 and parts[1]:
                        docstring_content.append(parts[1])
            elif in_docstring:
                if quote in stripped:
                    in_docstring = False
                    if docstring_content:
                        result.append(f"  {i}: {current_func or 'module'}: {docstring_content[-1][:100]}")
                        docstring_content = []
                else:
                    docstring_content.append(stripped)

            if stripped.startswith("def ") or stripped.startswith("async def "):
                match = re.search(r"def\s+(\w+)", stripped)
                if match:
                    current_func = f"def {match.group(1)}()"
            elif stripped.startswith("class "):
                match = re.search(r"class\s+(\w+)", stripped)
                if match:
                    current_func = f"class {match.group(1)}"

        return "\n".join(result) if result else "未找到文档"

    def _extract_js(self, content: str, file_path: str) -> str:
        result = [f"// {file_path}\n"]
        patterns = [
            (r"/\*\*\s*\n([\s\S]*?)\n\s*\*/", "JSDoc"),
            (r"function\s+(\w+)", "function"),
            (r"const\s+(\w+)\s*=", "const"),
            (r"class\s+(\w+)", "class"),
        ]

        for pattern, label in patterns:
            matches = re.finditer(pattern, content)
            for m in matches:
                if label == "JSDoc":
                    doc = " ".join(m.group(1).split())[:100]
                    result.append(f"  {label}: {doc}")
                else:
                    result.append(f"  {label}: {m.group(1)}")

        return "\n".join(result) if result else "未找到文档"

    def _extract_generic(self, content: str, file_path: str) -> str:
        result = [f"// {file_path}\n"]
        patterns = [
            (r"func\s+(\w+)", "function"),
            (r"func\s+(\w+)", "function"),
            (r"class\s+(\w+)", "class"),
            (r"//\s*(.+)$", "comment"),
        ]

        for pattern, label in patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for m in list(matches)[:20]:
                if label == "comment":
                    result.append(f"  // {m.group(1)[:80]}")
                else:
                    result.append(f"  {label}: {m.group(1)}")

        return "\n".join(result) if result else "未找到文档"


class GenerateMarkdownTool(Tool):
    """生成 Markdown 文档"""

    name = "generate_markdown"
    description = "根据项目信息生成 Markdown 格式的文档"
    parameters = {
        "type": "object",
        "properties": {
            "project_name": {
                "type": "string",
                "description": "项目名称",
            },
            "content": {
                "type": "string",
                "description": "文档内容（可以是结构化的文本）",
            },
            "output_path": {
                "type": "string",
                "description": "输出文件路径",
            },
            "doc_type": {
                "type": "string",
                "description": "文档类型: README | API | CHANGELOG",
                "enum": ["README", "API", "CHANGELOG"],
            },
        },
        "required": ["project_name", "content", "output_path", "doc_type"],
    }

    def execute(self, project_name: str, content: str, output_path: str,
               doc_type: str = "README") -> str:
        try:
            p = Path(output_path).expanduser().resolve()
            p.parent.mkdir(parents=True, exist_ok=True)

            if doc_type == "README":
                markdown = self._generate_readme(project_name, content)
            elif doc_type == "API":
                markdown = self._generate_api_doc(project_name, content)
            elif doc_type == "CHANGELOG":
                markdown = self._generate_changelog(project_name, content)
            else:
                markdown = content

            p.write_text(markdown, encoding="utf-8")
            return f"文档已生成: {output_path}\n共 {len(markdown)} 字符"
        except Exception as e:
            return f"Error: {e}"

    def _generate_readme(self, project_name: str, content: str) -> str:
        return f"""# {project_name}

## 项目简介

{content}

## 目录结构

```
.
```

## 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 运行
python main.py
```

## 功能特性

- 功能 1
- 功能 2
- 功能 3

## 技术栈

- Python 3.10+
- 其他依赖...

## 贡献指南

欢迎提交 Pull Request！

## 许可证

MIT License
"""

    def _generate_api_doc(self, project_name: str, content: str) -> str:
        return f"""# {project_name} - API 文档

## 概述

本文档描述了 {project_name} 的程序接口。

## 目录

- [模块](#模块)

{content}

## 模块

### 主模块

详细接口说明...
"""

    def _generate_changelog(self, project_name: str, content: str) -> str:
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        return f"""# Changelog

All notable changes to this project will be documented in this file.

## [{today}] - Initial Release

### Added
- Initial release
{content}
"""


class ListFilesTool(Tool):
    """列出目录中的文件"""

    name = "list_files"
    description = "列出指定目录下的所有文件"
    parameters = {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "目录路径",
            },
        },
        "required": ["path"],
    }

    def execute(self, path: str = ".") -> str:
        try:
            base = Path(path).expanduser().resolve()
            if not base.exists():
                return f"Error: 路径不存在: {path}"

            items = []
            for item in sorted(base.iterdir()):
                if item.is_dir():
                    items.append(f"[DIR]  {item.name}/")
                else:
                    size = item.stat().st_size
                    size_str = f"{size/1024:.1f}KB" if size > 1024 else f"{size}B"
                    items.append(f"[FILE] {item.name} ({size_str})")

            return "\n".join(items) if items else "(空目录)"
        except Exception as e:
            return f"Error: {e}"


class WriteDocTool(Tool):
    """写入文档文件"""

    name = "write_doc"
    description = "将内容写入文档文件"
    parameters = {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "文件路径",
            },
            "content": {
                "type": "string",
                "description": "文档内容",
            },
        },
        "required": ["file_path", "content"],
    }

    def execute(self, file_path: str, content: str) -> str:
        try:
            p = Path(file_path).expanduser().resolve()
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content, encoding="utf-8")
            lines = content.count("\n") + 1
            return f"已写入 {lines} 行到 {file_path}"
        except Exception as e:
            return f"Error: {e}"
