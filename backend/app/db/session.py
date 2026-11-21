from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

# Supabase / pgbouncer compatibility:
#   - statement_cache_size=0 disables asyncpg's prepared statement cache
#     (pgbouncer transaction pooling rejects cached prepared statements)
#   - ssl='require' because Supabase mandates TLS
_is_supabase = "supabase.com" in settings.database_url

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    connect_args=(
        {"statement_cache_size": 0, "ssl": "require"} if _is_supabase else {}
    ),
)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
