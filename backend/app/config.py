import os

class Settings:
    PROJECT_NAME: str = "MSME Commercial Preservation Platform (LS-03)"
    API_V1_PREFIX: str = "/api/v1"
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH: str = os.path.join(BASE_DIR, "msme_platform.db").replace("\\", "/")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")
    
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    CORPORATE_TAX_RATE: float = 0.30
    RBI_BANK_RATE: float = 0.0675  # 6.75%
    MSMED_INTEREST_MULTIPLIER: float = 3.0 # 3x RBI rate (~20.25% p.a.)

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
