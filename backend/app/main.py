from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ai import router as ai_router

app = FastAPI(title="AI Group Chat Backend")

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.16.16.110:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)

@app.get("/health")
def health():
    return {"ok": True}
