import requests
import json

# Test data
login_data = {
    "username": "admin",
    "password": "adminpassword"
}

print(f"Testing login with: {json.dumps(login_data, indent=2)}")

# Try to login
response = requests.post(
    "http://localhost:8002/api/stock/login",
    json=login_data,
    headers={
        "Content-Type": "application/json"
    }
)

print(f"Status code: {response.status_code}")
if response.status_code == 200:
    print("Login successful!")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Save the token
    token = response.json().get("access_token")
    
    # Test the profile endpoint
    if token:
        print("\nTesting profile endpoint with token...")
        profile_response = requests.get(
            "http://localhost:8002/api/stock/profile",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        print(f"Profile status code: {profile_response.status_code}")
        if profile_response.status_code == 200:
            print(f"Profile data: {json.dumps(profile_response.json(), indent=2)}")
        else:
            print(f"Profile endpoint failed: {profile_response.text}")
else:
    print(f"Login failed: {response.text}") 
import json

# Test data
login_data = {
    "username": "admin",
    "password": "adminpassword"
}

print(f"Testing login with: {json.dumps(login_data, indent=2)}")

# Try to login
response = requests.post(
    "http://localhost:8002/api/stock/login",
    json=login_data,
    headers={
        "Content-Type": "application/json"
    }
)

print(f"Status code: {response.status_code}")
if response.status_code == 200:
    print("Login successful!")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Save the token
    token = response.json().get("access_token")
    
    # Test the profile endpoint
    if token:
        print("\nTesting profile endpoint with token...")
        profile_response = requests.get(
            "http://localhost:8002/api/stock/profile",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        print(f"Profile status code: {profile_response.status_code}")
        if profile_response.status_code == 200:
            print(f"Profile data: {json.dumps(profile_response.json(), indent=2)}")
        else:
            print(f"Profile endpoint failed: {profile_response.text}")
else:
    print(f"Login failed: {response.text}") 
import json

# Test data
login_data = {
    "username": "admin",
    "password": "adminpassword"
}

print(f"Testing login with: {json.dumps(login_data, indent=2)}")

# Try to login
response = requests.post(
    "http://localhost:8002/api/stock/login",
    json=login_data,
    headers={
        "Content-Type": "application/json"
    }
)

print(f"Status code: {response.status_code}")
if response.status_code == 200:
    print("Login successful!")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    # Save the token
    token = response.json().get("access_token")
    
    # Test the profile endpoint
    if token:
        print("\nTesting profile endpoint with token...")
        profile_response = requests.get(
            "http://localhost:8002/api/stock/profile",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        print(f"Profile status code: {profile_response.status_code}")
        if profile_response.status_code == 200:
            print(f"Profile data: {json.dumps(profile_response.json(), indent=2)}")
        else:
            print(f"Profile endpoint failed: {profile_response.text}")
else:
    print(f"Login failed: {response.text}") 