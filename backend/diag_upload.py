import requests

login_data = {"username": "final@test.com", "password": "Password123"}
r = requests.post("http://127.0.0.1:8000/login", data=login_data)
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("Attempting to post with media...")
# Create a dummy image
with open("dummy.png", "wb") as f:
    f.write(b"fake image data")

files = {"media": ("dummy.png", open("dummy.png", "rb"), "image/png")}
data = {"content": "Here is a test image"}

res = requests.post("http://127.0.0.1:8000/posts", headers=headers, data=data, files=files)
print("Status:", res.status_code)
print("Response:", res.text)
