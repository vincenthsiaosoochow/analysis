import sys
import os

# Ensure the parent directory is in the python path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

def update_schema():
    print("Beginning database schema update...")
    try:
        with engine.connect() as conn:
            # Modify the image_url column to LONGTEXT
            # MySQL syntax
            print("Altering artwork_analyses table...")
            conn.execute(text("ALTER TABLE artwork_analyses MODIFY image_url LONGTEXT COMMENT '作品图片URL';"))
            conn.commit()
            print("Successfully updated image_url column to LONGTEXT.")
    except Exception as e:
        print(f"Error updating schema: {e}")
        print("Please check your database connection or if the table exists.")

if __name__ == "__main__":
    update_schema()
