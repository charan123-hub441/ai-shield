import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend", "pov.db")
if not os.path.exists(DB_PATH):
    # Try alternate path
    DB_PATH = "pov.db"

def migrate():
    print(f"Migrating database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Rename existing users table
    try:
        cursor.execute("ALTER TABLE users RENAME TO old_users")
    except sqlite3.OperationalError:
        print("Table 'users' doesn't exist, skipping rename.")
        return

    # 2. Create new users table with nullable email/password
    cursor.execute("""
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR NOT NULL UNIQUE,
        email VARCHAR UNIQUE,
        hashed_password VARCHAR,
        phone_number VARCHAR UNIQUE,
        otp_code VARCHAR,
        otp_expiry DATETIME,
        two_factor_enabled BOOLEAN DEFAULT 0,
        role VARCHAR DEFAULT 'user',
        full_name VARCHAR,
        bio TEXT,
        profile_pic_url VARCHAR,
        warn_count INTEGER DEFAULT 0,
        is_banned BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 3. Copy existing data
    # We need to map old columns to new columns.
    # Old columns (as seen in PRAGMA): id, username, email, hashed_password, role, full_name, bio, profile_pic_url, warn_count, is_banned, created_at, phone_number, otp_code, otp_expiry, two_factor_enabled
    # Note: phone_number and others might not exist in old_users if previous migration failed partway.
    
    cursor.execute("PRAGMA table_info(old_users)")
    old_cols = [row[1] for row in cursor.fetchall()]
    
    shared_cols = [
        "id", "username", "email", "hashed_password", "role", 
        "full_name", "bio", "profile_pic_url", "warn_count", 
        "is_banned", "created_at"
    ]
    # Check if a few more exist
    for col in ["phone_number", "otp_code", "otp_expiry", "two_factor_enabled"]:
        if col in old_cols:
            shared_cols.append(col)

    cols_str = ", ".join(shared_cols)
    cursor.execute(f"INSERT INTO users ({cols_str}) SELECT {cols_str} FROM old_users")

    # 4. Drop old table
    cursor.execute("DROP TABLE old_users")
    
    conn.commit()
    conn.close()
    print("Migration successful! Users table is now flexible.")

if __name__ == "__main__":
    migrate()
