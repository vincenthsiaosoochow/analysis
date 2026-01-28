
from sqlalchemy import create_engine, text
from app.config import settings

def add_is_deleted_to_users():
    # Use settings.DATABASE_URL directly
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        try:
            print("Attempting to add 'is_deleted' column to 'users' table...")
            # Try to add the column. If it exists, it will throw an error, which we catch.
            conn.execute(text("ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0"))
            conn.commit()
            print("Column 'is_deleted' added successfully.")
        except Exception as e:
            # Check if error is due to column existing
            err_str = str(e).lower()
            if "duplicate column" in err_str or "already exists" in err_str:
                print("Column 'is_deleted' already exists. Skipping.")
            else:
                print(f"Migration warning (might be safe if column exists): {e}")

if __name__ == "__main__":
    add_is_deleted_to_users()
