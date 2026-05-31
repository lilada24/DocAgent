"""DocAgent CLI - 文档生成 Agent 命令行工具"""

import argparse
import os
import sys
from pathlib import Path

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax

from .llm import LLM
from .doc_agent import DocAgent

load_dotenv()

console = Console(force_terminal=True)


def main():
    parser = argparse.ArgumentParser(
        description="DocAgent - AI 文档生成工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  docagent -m deepseek-chat                           # 交互模式
  docagent -m deepseek-chat --project ./myproject     # 为指定项目生成文档
  docagent -m deepseek-chat --generate readme          # 只生成 README
  docagent -m deepseek-chat --generate all             # 生成所有文档
  docagent -p "为这个项目写一份 API 文档" -m deepseek-chat  # 单次任务

环境变量:
  OPENAI_API_KEY      API 密钥
  OPENAI_BASE_URL     API 地址（可选）
  CORECODER_MODEL     默认模型（可选）
        """,
    )

    parser.add_argument(
        "-m", "--model",
        default=os.getenv("CORECODER_MODEL", "deepseek-chat"),
        help="使用的模型 (默认: deepseek-chat)",
    )
    parser.add_argument(
        "-p", "--prompt",
        help="单次任务提示词（不指定则进入交互模式）",
    )
    parser.add_argument(
        "--project",
        default=".",
        help="项目路径 (默认: 当前目录)",
    )
    parser.add_argument(
        "--generate",
        choices=["readme", "api", "all"],
        help="自动生成文档类型",
    )
    parser.add_argument(
        "--language",
        choices=["chinese", "english"],
        default="chinese",
        help="文档语言 (默认: chinese)",
    )
    parser.add_argument(
        "--api-key",
        default=os.getenv("OPENAI_API_KEY"),
        help="API 密钥（也可以通过 OPENAI_API_KEY 环境变量设置）",
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com"),
        help="API 地址 (默认: https://api.deepseek.com)",
    )

    args = parser.parse_args()

    if not args.api_key:
        console.print("[red]错误: 未设置 API 密钥[/red]")
        console.print("请设置 OPENAI_API_KEY 环境变量或使用 --api-key 参数")
        console.print("\n示例:")
        console.print("  $env:OPENAI_API_KEY = 'your-key'")
        console.print("  docagent -m deepseek-chat")
        return

    llm = LLM(
        model=args.model,
        api_key=args.api_key,
        base_url=args.base_url if args.base_url else None,
    )

    doc_agent = DocAgent(
        llm=llm,
        project_path=args.project,
        language=args.language,
    )

    console.print(Panel.fit(
        "[bold cyan]DocAgent - AI 文档生成工具[/bold cyan]\n"
        f"模型: {args.model}\n"
        f"项目: {Path(args.project).resolve()}\n"
        f"语言: {args.language}",
        border_style="cyan",
    ))

    if args.prompt:
        console.print("\n[cyan]开始生成文档...[/cyan]\n")
        result = doc_agent.chat(args.prompt)
        console.print(Panel(result, title="结果", border_style="green"))
    elif args.generate:
        console.print(f"\n[cyan]正在生成 {args.generate} 文档...[/cyan]\n")
        if args.generate == "readme":
            result = doc_agent.generate_readme()
        elif args.generate == "api":
            result = doc_agent.generate_api_doc()
        else:
            result = doc_agent.generate_all()
        console.print(Panel(result, title="结果", border_style="green"))
    else:
        console.print("\n[yellow]进入交互模式，输入 'quit' 或 'exit' 退出[/yellow]\n")
        console.print("[cyan]你可以输入任何文档生成需求，例如:[/cyan]")
        console.print('  "为这个项目生成 README"')
        console.print('  "写一份 API 文档"')
        console.print('  "生成项目文档，包含安装和使用说明"\n')

        while True:
            try:
                user_input = console.input("[user]> ")
                if user_input.lower() in ["quit", "exit", "q"]:
                    console.print("[cyan]再见！[/cyan]")
                    break

                if not user_input.strip():
                    continue

                console.print("\n[cyan]思考中...[/cyan]\n")
                result = doc_agent.chat(user_input)
                console.print(Panel(result, title="响应", border_style="green"))
                console.print()
            except KeyboardInterrupt:
                console.print("\n[cyan]再见！[/cyan]")
                break


if __name__ == "__main__":
    main()
