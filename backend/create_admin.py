import sys
import os

# Ensure the parent directory is in the python path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User

def promote_to_admin(phone_number):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.phone == phone_number).first()
        if not user:
            print(f"User with phone {phone_number} not found.")
            return
        
        user.is_admin = 1
        db.commit()
        print(f"Successfully promoted user {user.name} ({user.phone}) to ADMIN.")
        
    except Exception as e:
        print(f"Error promoting user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python create_admin.py <PHONE_NUMBER>")
    else:
        promote_to_admin(sys.argv[1])
