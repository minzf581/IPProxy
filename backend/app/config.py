from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    IPIPV_API_BASE_URL: str = "https://api.ipipv.net"
    DATABASE_URL: str = "sqlite:///./app.db"

    class Config:
        env_file = ".env"

settings = Settings() 