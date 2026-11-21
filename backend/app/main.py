from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes_auth import router as auth_router
from app.api.routes_team import router as team_router
from app.api.routes_scores import router as scores_router
from app.api.routes_issues import router as issues_router
from app.api.routes_todos import router as todos_router
from app.api.routes_meetings import router as meetings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Altri Level-10 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"
app.include_router(auth_router, prefix=PREFIX)
app.include_router(team_router, prefix=PREFIX)
app.include_router(scores_router, prefix=PREFIX)
app.include_router(issues_router, prefix=PREFIX)
app.include_router(todos_router, prefix=PREFIX)
app.include_router(meetings_router, prefix=PREFIX)


@app.get("/health")
async def health():
    return {"ok": True}
