
from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def add_is_deleted_to_users():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("SHOW COLUMNS FROM users LIKE 'is_deleted'"))
            if result.fetchone():
                print("Column 'is_deleted' already exists in 'users' table.")
            else:
                print("Adding 'is_deleted' column into 'users' table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN is_deleted INTEGER DEFAULT 0"))
                print("Column added successfully.")
        except Exception as e:
            print(f"Error updating database: {e}")

if __name__ == "__main__":
    add_is_deleted_to_users()
