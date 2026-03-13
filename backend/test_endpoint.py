import requests

url = "http://localhost:5000/api/triage/analyze"
data = {
    "symptoms": "coma",
    "age": 45,
    "is_emergency": False
}

print(f"Testing {url}...")
try:
    response = requests.post(url, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
