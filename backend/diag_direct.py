import database
import models
from schemas import UserCreate
from routes.auth import register

# Ensure tables exist
models.Base.metadata.create_all(bind=database.engine)

db = next(database.get_db())
payload = UserCreate(email="direct@test.com", username="direct", password="Password123")

try:
    print("Calling register...")
    res = register(payload=payload, db=db)
    print("Success:", res)
except Exception as e:
    import traceback
    print("CRASHED:")
    traceback.print_exc()
