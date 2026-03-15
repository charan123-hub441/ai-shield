import database
import models
from schemas import UserCreate
from routes.auth import register

# Ensure tables exist
models.Base.metadata.create_all(bind=database.engine)

db = next(database.get_db())
payload = UserCreate(email="direct2@test.com", username="direct2", password="Password123")

try:
    print("Calling register...")
    res = register(payload=payload, db=db)
    print("Success:", res)
except Exception as e:
    import traceback
    with open('error.txt', 'w', encoding='utf-8') as f:
        f.write("CRASHED:\n")
        f.write(traceback.format_exc())
