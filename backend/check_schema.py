import sqlite3

conn = sqlite3.connect("msme_platform.db")
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)

for t in ["companies", "invoices", "users"]:
    if t in tables:
        cur.execute(f"PRAGMA table_info({t})")
        cols = [c[1] for c in cur.fetchall()]
        print(f"Columns for {t}:", cols)
