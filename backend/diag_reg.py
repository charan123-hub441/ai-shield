from main import app
from fastapi.testclient import TestClient
import json

client = TestClient(app)

print("Attempting to register a user...")
try:
    response = client.post("/register", json={
        "email": "diag@test.com",
        "username": "diag",
        "password": "Password123"
    })
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    import traceback
    print("CRASH DETECTED:")
    print(traceback.format_exc())
