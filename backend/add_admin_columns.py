import sys
import os

# Ensure the parent directory is in the python path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def update_schema_admin():
    print("Beginning database schema update for Admin Dashboard...")
    try:
        with engine.connect() as conn:
            # 1. Add is_admin to users table
            print("Adding is_admin to users table...")
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_admin TINYINT DEFAULT 0 COMMENT '是否为管理员';"))
                print("Successfully added is_admin to users.")
            except Exception as e:
                print(f"Skipping users update (maybe column exists): {e}")

            # 2. Add is_deleted to artwork_analyses table
            print("Adding is_deleted to artwork_analyses table...")
            try:
                conn.execute(text("ALTER TABLE artwork_analyses ADD COLUMN is_deleted TINYINT DEFAULT 0 COMMENT '是否已删除';"))
                print("Successfully added is_deleted to artwork_analyses.")
            except Exception as e:
                print(f"Skipping artwork_analyses update (maybe column exists): {e}")
            
            conn.commit()
            print("Schema update completed.")
            
    except Exception as e:
        print(f"Error updating schema: {e}")
        print("Please check your database connection or if the table exists.")

if __name__ == "__main__":
    update_schema_admin()
