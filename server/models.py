import requests
import os

api_key = "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"
print("API Key:", api_key)  # Kiểm tra xem API key đã được tải đúng chưa
url = "https://api.groq.com/openai/v1/models"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)

print(response.json())