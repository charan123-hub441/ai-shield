import urllib.request
import json
import traceback

print("Triggering /register...")
url = "http://127.0.0.1:8000/register"
data = {"email": "test@test.com", "username": "test", "password": "Password123"}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Other Error: {e}")
    traceback.print_exc()
