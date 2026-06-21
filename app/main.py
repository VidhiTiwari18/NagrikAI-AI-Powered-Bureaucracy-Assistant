from fastapi import FastAPI, UploadFile, File

app = FastAPI()

@app.get("/")
def home():
    return {"message": "AI Bureaucracy Assistant Running"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    
    content = await file.read()

    extension= file.filename.split(".")[-1].lower()
    allowed_extension=["pdf","jpg","jpeg","png"]
    if extension not in allowed_extension:
        return{
            "error":"Only PDF,JPG,JPEG And PNG Files Are Allowed"
        }

    with open(f"uploads/{file.filename}", "wb") as f:
        f.write(content)

    return {
        "filename": file.filename,
        "message": "File uploaded successfully"
    }