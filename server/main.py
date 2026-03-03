import os
import argparse
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List

# Set up argument parsing
parser = argparse.ArgumentParser(description="Run the Prompt Library Server")
# Default to "prompts" directory in the current working directory or project root
default_dir = os.path.join(os.getcwd(), "prompts")
parser.add_argument("--dir", type=str, default=default_dir, help="Path to the prompt folder")
parser.add_argument("--port", type=int, default=8000, help="Port to run the server on")

# We parse known args to avoid conflicts if uvicorn adds its own
args, _ = parser.parse_known_args()

PROMPT_DIR = args.dir

# Ensure the directory exists
if not os.path.exists(PROMPT_DIR):
    try:
        os.makedirs(PROMPT_DIR)
        print(f"Created prompt directory at: {PROMPT_DIR}")
    except Exception as e:
        print(f"Warning: Could not create directory {PROMPT_DIR}: {e}")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptUpdate(BaseModel):
    content: str

class PromptCreate(BaseModel):
    filename: str
    content: str

@app.get("/api/prompts")
def list_prompts():
    """List all prompt files in the directory."""
    if not os.path.exists(PROMPT_DIR):
        return []
    
    files = []
    try:
        for filename in os.listdir(PROMPT_DIR):
            if os.path.isfile(os.path.join(PROMPT_DIR, filename)):
                files.append(filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"files": sorted(files)}

@app.get("/api/prompts/{filename}")
def get_prompt(filename: str):
    """Get the content of a specific prompt file."""
    file_path = os.path.join(PROMPT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"filename": filename, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/prompts/{filename}")
def update_prompt(filename: str, prompt: PromptUpdate):
    """Update the content of an existing prompt file."""
    file_path = os.path.join(PROMPT_DIR, filename)
    # Security check to prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
         raise HTTPException(status_code=400, detail="Invalid filename")

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(prompt.content)
        return {"status": "success", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/prompts")
def create_prompt(prompt: PromptCreate):
    """Create a new prompt file."""
    filename = prompt.filename
    # Basic validation
    if ".." in filename or "/" in filename or "\\" in filename:
         raise HTTPException(status_code=400, detail="Invalid filename")
         
    if not filename.endswith(".txt") and not filename.endswith(".md"):
        filename += ".txt" # Default extension

    file_path = os.path.join(PROMPT_DIR, filename)
    if os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File already exists")

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(prompt.content)
        return {"status": "success", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/prompts/{filename}")
def delete_prompt(filename: str):
    """Delete a prompt file."""
    file_path = os.path.join(PROMPT_DIR, filename)
    # Security check
    if ".." in filename or "/" in filename or "\\" in filename:
         raise HTTPException(status_code=400, detail="Invalid filename")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(file_path)
        return {"status": "success", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print(f"Starting server serving files from: {PROMPT_DIR}")
    uvicorn.run(app, host="127.0.0.1", port=args.port)
