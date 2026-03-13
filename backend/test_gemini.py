import google.generativeai as genai
import json

genai.configure(api_key="AIzaSyCOzwIIpBmV10DoT-LLODmmFfVAiCNtPp4")
model = genai.GenerativeModel("gemini-1.5-flash")

print("Testing Gemini API...")
try:
    response = model.generate_content("Hello, provide a JSON response with 'status': 'ok'")
    print(f"Raw Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
