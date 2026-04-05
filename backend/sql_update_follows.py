import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'pov.db')

def update_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if the column exists
        cursor.execute("PRAGMA table_info(user_follows)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "status" not in columns:
            print("Adding 'status' column to 'user_follows' table...")
            cursor.execute("ALTER TABLE user_follows ADD COLUMN status VARCHAR DEFAULT 'accepted'")
            conn.commit()
            print("Column 'status' added successfully.")
        else:
            print("Column 'status' already exists in 'user_follows' table.")
            
    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_db()
