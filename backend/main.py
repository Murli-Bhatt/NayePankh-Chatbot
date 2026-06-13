import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

# Get absolute path to parent directory .env file
parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=parent_env)

app = FastAPI(title="NayePankh Chatbot Backend Proxy")

# Configure CORS so React app on port 5173 can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your specific frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatPayload(BaseModel):
    model: str = "llama-3.3-70b-versatile"
    messages: list[ChatMessage]
    max_tokens: int = 1000

@app.post("/api/chat")
async def chat_proxy(payload: ChatPayload):
    # Fetch key from environment (loaded from parent .env file)
    api_key = os.getenv("REACT_APP_GROQ_API_KEY") or os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured on the backend server. Please verify your root .env file."
        )
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key.strip()}"
    }
    
    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    
    # Map messages list to API format
    formatted_messages = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
    
    try:
        response = requests.post(
            groq_url,
            headers=headers,
            json={
                "model": payload.model,
                "messages": formatted_messages,
                "max_tokens": payload.max_tokens
            },
            timeout=30
        )
        
        if not response.ok:
            try:
                err_data = response.json()
            except Exception:
                err_data = {"error": {"message": response.text}}
            
            # Forward the error message from Groq
            groq_error = err_data.get("error", {}).get("message", "API response error")
            raise HTTPException(status_code=response.status_code, detail=groq_error)
            
        return response.json()
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Connection to Groq API failed: {str(e)}"
        )
