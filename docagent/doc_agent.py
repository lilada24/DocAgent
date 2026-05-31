"""DocAgent - 基于 CoreCoder 的文档生成专用 Agent"""

import os
from pathlib import Path
from .agent import Agent
from .llm import LLM
from .tools import (
    ALL_TOOLS,
    ScanProjectTool,
    ExtractDocFromCodeTool,
    GenerateMarkdownTool,
    ListFilesTool,
    WriteDocTool,
    ReadFileTool,
    GlobTool,
)
from .prompt import system_prompt


DOC_AGENT_SYSTEM_PROMPT = """\
You are DocAgent, an AI documentation generator specialized in:
- Analyzing code structure and extracting documentation
- Generating README files, API docs, and changelogs
- Writing clear, comprehensive documentation in Chinese or English
- Following best practices for documentation structure

# Your Task
Analyze the user's project and generate high-quality documentation.
You can:
1. Scan project structure to understand the codebase
2. Extract documentation from code (docstrings, comments, JSDoc)
3. Generate README, API documentation, or other markdown files
4. Write documentation content

# Tools
- scan_project: Scan project structure
- extract_doc: Extract documentation from code
- list_files: List directory contents
- read_file: Read any file
- write_doc: Write documentation to file
- generate_markdown: Generate formatted markdown document
- glob: Find files by pattern
- grep: Search file contents

# Rules
1. **Always scan first.** Before generating docs, scan the project to understand its structure.
2. **Be comprehensive.** Extract documentation from all major files.
3. **Be clear.** Write in simple, understandable language.
4. **Follow conventions.** Use standard documentation structure (README, API docs, etc.)
5. **Include examples.** Add code examples where helpful.
6. **Language:** Generate documentation in the same language as the user's request.

# Output Format
When generating documentation:
- Use proper Markdown formatting
- Include table of contents for large documents
- Add code blocks with syntax highlighting hints
- Include badges or status indicators where appropriate
"""


class DocAgent:
    def __init__(
        self,
        llm: LLM,
        project_path: str = ".",
        language: str = "chinese",
    ):
        self.llm = llm
        self.project_path = Path(project_path).resolve()
        self.language = language

        doc_tools = [
            ScanProjectTool(),
            ExtractDocFromCodeTool(),
            GenerateMarkdownTool(),
            ListFilesTool(),
            WriteDocTool(),
            ReadFileTool(),
            GlobTool(),
        ]

        self.agent = Agent(
            llm=llm,
            tools=doc_tools,
            max_context_tokens=128_000,
            max_rounds=30,
        )

        self.agent._system = DOC_AGENT_SYSTEM_PROMPT

    def generate_readme(self, project_name: str = None) -> str:
        """生成 README 文档"""
        if project_name is None:
            project_name = self.project_path.name

        user_input = f"""请为项目 "{project_name}" 生成 README 文档。

要求：
1. 首先使用 scan_project 扫描项目结构
2. 提取关键代码文件的文档
3. 生成完整的 README.md，内容包括：
   - 项目简介
   - 功能特性
   - 快速开始
   - 目录结构
   - 技术栈
4. 使用 {self.language} 语言撰写
5. 输出到 {self.project_path / "README.md"}"""

        return self.agent.chat(user_input)

    def generate_api_doc(self, project_name: str = None) -> str:
        """生成 API 文档"""
        if project_name is None:
            project_name = self.project_path.name

        user_input = f"""请为项目 "{project_name}" 生成 API 文档。

要求：
1. 使用 scan_project 扫描项目中的代码文件
2. 使用 extract_doc 提取各文件的函数和类文档
3. 生成 API.md，包含：
   - 模块说明
   - 函数列表及说明
   - 参数说明
   - 使用示例
4. 使用 {self.language} 语言撰写
5. 输出到 {self.project_path / "API.md"}"""

        return self.agent.chat(user_input)

    def generate_all(self, project_name: str = None) -> str:
        """生成所有文档"""
        if project_name is None:
            project_name = self.project_path.name

        user_input = f"""请为项目 "{project_name}" 生成完整的文档集。

请依次执行：
1. scan_project 扫描项目结构
2. extract_doc 提取代码文档
3. 生成 README.md（项目简介、快速开始、特性等）
4. 生成 API.md（模块、函数、参数说明）
5. 生成 CHANGELOG.md（更新日志模板）

所有文档使用 {self.language} 语言。
文档保存在 {self.project_path} 目录。"""

        return self.agent.chat(user_input)

    def chat(self, user_input: str) -> str:
        """通用对话（用于自定义文档需求）"""
        return self.agent.chat(user_input)
