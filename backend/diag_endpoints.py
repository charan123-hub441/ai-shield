import urllib.request
import urllib.parse
import json

def test():
    # Login
    login_url = "http://127.0.0.1:8000/login"
    login_data = json.dumps({"email": "connected2@test.com", "password": "Password123"}).encode('utf-8')
    req = urllib.request.Request(login_url, data=login_data, headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            token = data["access_token"]
            print("Login success, token obtained.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # Check /users/me
    me_url = "http://127.0.0.1:8000/users/me"
    req_me = urllib.request.Request(me_url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req_me) as resp:
            print(f"/users/me status: {resp.status}")
            print(f"/users/me body: {resp.read().decode()}")
    except Exception as e:
        print(f"/users/me failed: {e}")

    # Check /posts
    posts_url = "http://127.0.0.1:8000/posts"
    req_posts = urllib.request.Request(posts_url, headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req_posts) as resp:
            print(f"/posts (GET) status: {resp.status}")
    except Exception as e:
        print(f"/posts (GET) failed: {e}")

if __name__ == "__main__":
    test()
