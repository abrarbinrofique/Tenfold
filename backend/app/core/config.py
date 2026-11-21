from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://altri:altri@db:5432/altri"
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_ttl_hours: int = 24
    app_now: str = "2026-11-11T15:00:00Z"
    company_timezone: str = "America/Chicago"
    cors_origin: str = "http://localhost:3000"
    seed_path: str = "/app/seed.json"

    class Config:
        env_file = ".env"


settings = Settings()
