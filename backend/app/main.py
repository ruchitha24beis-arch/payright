from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.models.company import Company
from app.seed_data import seed_database
from app.routers import invoices, settlements, guest_portal, treds, reminders, safeguards, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables are created
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Check if database is empty, seed if so
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Company))
        if not res.scalars().first():
            print("Database empty. Seeding initial MSME and Corporate Buyer dataset...")
            await seed_database()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="MSME Payment Recovery & Commercial Preservation Platform under Section 43B(h), TReDS, and Pro-Rata Milestones",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded documents
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(invoices.router, prefix=settings.API_V1_PREFIX)
app.include_router(settlements.router, prefix=settings.API_V1_PREFIX)
app.include_router(guest_portal.router, prefix=settings.API_V1_PREFIX)
app.include_router(treds.router, prefix=settings.API_V1_PREFIX)
app.include_router(reminders.router, prefix=settings.API_V1_PREFIX)
app.include_router(safeguards.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "status": "OPERATIONAL",
        "philosophy": "100% Commercial Relationship Preservation, Sec 43B(h) Tax Advisories, TReDS Factoring, EMI Milestones",
        "documentation": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "HEALTHY", "service": "MSME Commercial Recovery Engine"}
