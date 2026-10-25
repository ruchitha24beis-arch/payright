import asyncio
import sqlite3
import os
from app.database import engine, Base
# Import all models to ensure metadata has everything
from app.models.company import Company
from app.models.user import User
from app.models.invoice import Invoice
from app.models.emi import EMIPlan, EMISchedule
from app.models.order import LinkedOrder
from app.models.portal_session import AggregatedPortalToken
from app.models.samadhan import SamadhanDossier
from app.seed_data import seed_database

async def migrate_and_seed():
    db_path = os.path.join(os.path.dirname(__file__), "msme_platform.db")
    print(f"Checking database at {db_path}...")
    
    # 1. Create all missing tables in SQLAlchemy
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] All SQLAlchemy tables verified/created.")

    # 2. Check and add columns to SQLite directly if table already existed without them
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("PRAGMA table_info(companies)")
    cols = [r[1] for r in cur.fetchall()]
    
    if "annual_turnover" not in cols:
        cur.execute("ALTER TABLE companies ADD COLUMN annual_turnover FLOAT")
        print("[OK] Added column annual_turnover to companies")
        
    if "net_profit_margin" not in cols:
        cur.execute("ALTER TABLE companies ADD COLUMN net_profit_margin FLOAT")
        print("[OK] Added column net_profit_margin to companies")
        
    if "mca_filing_status" not in cols:
        cur.execute("ALTER TABLE companies ADD COLUMN mca_filing_status VARCHAR(50) DEFAULT 'ACTIVE_COMPLIANT'")
        print("[OK] Added column mca_filing_status to companies")

    conn.commit()
    conn.close()

    # 3. Re-seed database with updated rich data
    print("Re-seeding dataset with corporate financials, users, and multi-invoice datasets...")
    await seed_database()
    print("[OK] Migration and re-seeding complete!")

if __name__ == "__main__":
    asyncio.run(migrate_and_seed())
