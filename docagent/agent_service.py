"""DocAgent FastAPI Service - AI 文档生成 HTTP API 服务"""

import asyncio
import json
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from .llm import LLM
from .doc_agent import DocAgent

load_dotenv()

app = FastAPI(
    title="DocAgent API",
    description="AI 文档生成服务 - 自动生成 README、API 文档等",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    project_path: str
    doc_type: str = "readme"
    language: str = "chinese"
    model: str = "deepseek-chat"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    project_name: Optional[str] = None
    task_id: Optional[str] = None  # 由后端传入，保证前后端任务 ID 一致


class GenerateResponse(BaseModel):
    task_id: str
    status: str
    message: str
    created_at: str


class TaskStatus(BaseModel):
    task_id: str
    status: str
    progress: int
    result: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str


class ProjectInfo(BaseModel):
    path: str
    name: str
    files_count: int
    languages: list


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str


tasks: Dict[str, Dict] = {}
websocket_connections: Dict[str, list] = {}


def get_default_api_key() -> str:
    return os.getenv("OPENAI_API_KEY", "")


def get_default_base_url() -> str:
    return os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now().isoformat()
    )


@app.post("/api/generate", response_model=GenerateResponse)
async def create_generation_task(
    request: GenerateRequest,
    background_tasks: BackgroundTasks
):
    if not request.api_key and not get_default_api_key():
        raise HTTPException(status_code=400, detail="API key is required")

    # 使用后端传入的 task_id，保证前后端任务 ID 一致
    task_id = request.task_id or f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"

    tasks[task_id] = {
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "request": request.dict(),
    }

    background_tasks.add_task(run_generation_task, task_id, request)

    return GenerateResponse(
        task_id=task_id,
        status="pending",
        message="Task created and started",
        created_at=datetime.now().isoformat()
    )


def run_generation_task(task_id: str, request: GenerateRequest):
    """同步函数，由 FastAPI BackgroundTasks 在线程池中执行，不阻塞事件循环"""
    try:
        tasks[task_id]["status"] = "running"
        tasks[task_id]["progress"] = 10
        tasks[task_id]["updated_at"] = datetime.now().isoformat()

        api_key = request.api_key or get_default_api_key()
        base_url = request.base_url or get_default_base_url()

        llm = LLM(
            model=request.model,
            api_key=api_key,
            base_url=base_url,
        )

        doc_agent = DocAgent(
            llm=llm,
            project_path=request.project_path,
            language=request.language,
        )

        tasks[task_id]["progress"] = 20
        tasks[task_id]["updated_at"] = datetime.now().isoformat()

        if request.doc_type == "readme":
            result = doc_agent.generate_readme(request.project_name)
        elif request.doc_type == "api":
            result = doc_agent.generate_api_doc(request.project_name)
        elif request.doc_type == "all":
            result = doc_agent.generate_all(request.project_name)
        else:
            result = doc_agent.chat(f"生成 {request.doc_type} 类型的文档")

        tasks[task_id]["status"] = "completed"
        tasks[task_id]["progress"] = 100
        tasks[task_id]["result"] = result
        tasks[task_id]["updated_at"] = datetime.now().isoformat()

    except Exception as e:
        tasks[task_id]["status"] = "failed"
        tasks[task_id]["error"] = str(e)
        tasks[task_id]["updated_at"] = datetime.now().isoformat()


@app.get("/api/tasks/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    task = tasks[task_id]
    return TaskStatus(
        task_id=task_id,
        status=task["status"],
        progress=task["progress"],
        result=task.get("result"),
        error=task.get("error"),
        created_at=task["created_at"],
        updated_at=task["updated_at"],
    )


@app.get("/api/tasks")
async def list_tasks(limit: int = 20):
    task_list = []
    for task_id, task in sorted(
        tasks.items(),
        key=lambda x: x[1]["created_at"],
        reverse=True
    )[:limit]:
        task_list.append({
            "task_id": task_id,
            "status": task["status"],
            "progress": task["progress"],
            "created_at": task["created_at"],
        })
    return {"tasks": task_list, "total": len(tasks)}


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    if tasks[task_id]["status"] == "running":
        raise HTTPException(status_code=400, detail="Cannot delete running task")

    del tasks[task_id]
    return {"message": "Task deleted", "task_id": task_id}


@app.post("/api/projects/scan")
async def scan_project(path: str):
    try:
        base = Path(path).expanduser().resolve()
        if not base.exists():
            raise HTTPException(status_code=404, detail="Path not found")

        from .tools.doc_generator import ScanProjectTool
        scanner = ScanProjectTool()
        result = scanner.execute(path=str(base))

        return {
            "path": str(base),
            "scan_result": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()

    if task_id not in websocket_connections:
        websocket_connections[task_id] = []
    websocket_connections[task_id].append(websocket)

    try:
        if task_id in tasks:
            await websocket.send_json({
                "type": "status",
                "task_id": task_id,
                "data": tasks[task_id]
            })

        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if task_id in websocket_connections:
            websocket_connections[task_id].remove(websocket)


async def broadcast_progress(task_id: str, progress: int, message: str, result: str = None):
    if task_id in websocket_connections:
        data = {
            "type": "progress",
            "task_id": task_id,
            "progress": progress,
            "message": message,
            "result": result,
            "timestamp": datetime.now().isoformat(),
        }
        for ws in websocket_connections[task_id]:
            try:
                await ws.send_json(data)
            except:
                pass


def run_server(host: str = "0.0.0.0", port: int = 8000):
    import uvicorn
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    run_server()