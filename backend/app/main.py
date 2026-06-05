from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .models import database as models
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from .utils import parsers, ai
from .utils.email import send_password_reset_email, is_email_configured, EmailNotConfigured

app = FastAPI(title="Quizter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
    ],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = models.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class QuizBase(BaseModel):
    id: str
    title: str
    category: str
    questions: List[dict]

class UserCreate(BaseModel):
    email: str
    password: str

# --- AUTH ROUTES ---
@app.post("/auth/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(email=user.email, hashed_password=user.password) # In prod, hash this!
    db.add(new_user)
    db.commit()
    return {"message": "User created successfully"}

@app.post("/auth/login")
def login(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or db_user.hashed_password != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate a mock token
    token = f"mock-token-{db_user.id}-{db_user.email}"
    return {"token": token, "email": db_user.email}

# --- FORGOT & RESET PASSWORD ROUTES ---
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@app.post("/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == req.email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Email address not found")
    
    # Generate a mock token
    token = f"reset-{db_user.email}"

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={token}"

    if is_email_configured():
        try:
            send_password_reset_email(db_user.email, reset_link)
        except EmailNotConfigured:
            _print_reset_link(req.email, reset_link)
        except Exception as e:
            # Don't leak whether the address exists; surface a generic mail error.
            print(f"❌ Failed to send password reset email: {e}")
            raise HTTPException(
                status_code=502,
                detail="Could not send the reset email. Please try again later.",
            )
    else:
        # No SMTP configured (e.g. local dev) — fall back to printing the link.
        _print_reset_link(req.email, reset_link)

    return {"message": "Reset link sent successfully"}


def _print_reset_link(email: str, reset_link: str):
    """Fallback used in development when SMTP is not configured."""
    print(f"\n==========================================")
    print(f"🔑 RESET PASSWORD LINK GENERATED:")
    print(f"For: {email}")
    print(f"Link: {reset_link}")
    print(f"==========================================\n")

@app.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not req.token.startswith("reset-"):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    email = req.token.replace("reset-", "")
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    db_user.hashed_password = req.new_password
    db.commit()
    
    return {"message": "Password reset successful"}

class SessionCreate(BaseModel):
    quiz_id: str

class SessionUpdate(BaseModel):
    status: Optional[str]
    current_question_index: Optional[int]

# --- QUIZ ROUTES ---
@app.get("/api/quizzes", response_model=List[QuizBase])
def get_quizzes(db: Session = Depends(get_db)):
    return db.query(models.Quiz).all()

@app.post("/api/quizzes")
def create_quiz(quiz: QuizBase, db: Session = Depends(get_db)):
    # Check if quiz exists
    existing = db.query(models.Quiz).filter(models.Quiz.id == quiz.id).first()
    if existing:
        # Update existing
        for key, value in quiz.dict().items():
            setattr(existing, key, value)
    else:
        # Create new
        db_quiz = models.Quiz(**quiz.dict())
        db.add(db_quiz)
    
    db.commit()
    return {"message": "Quiz saved"}

@app.post("/api/quizzes/generate")
async def generate_quiz(
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = Form(None),
    prompt: Optional[str] = Form(None),
    num_questions: int = Form(5),
    category: str = Form("General"),
    db: Session = Depends(get_db)
):
    source_text = ""
    
    if file:
        filename = file.filename.lower()
        content = await file.read()
        
        if filename.endswith(".pdf"):
            source_text = parsers.extract_text_from_pdf(content)
        elif filename.endswith(".docx"):
            source_text = parsers.extract_text_from_docx(content)
        elif filename.endswith(".pptx"):
            source_text = parsers.extract_text_from_pptx(content)
        elif filename.endswith((".txt", ".csv")):
            source_text = content.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, Word, PowerPoint, or Text files.")
            
    elif url:
        source_text = parsers.extract_text_from_url(url)
        
    elif prompt:
        source_text = f"General knowledge quiz about: {prompt}"
        
    else:
        raise HTTPException(status_code=400, detail="Please upload a document, paste a URL, or enter a text prompt.")
        
    if not source_text or len(source_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Could not extract sufficient text content to generate a quiz. Please check your document or link.")
        
    custom_prompt = prompt if (file or url) else ""
    generated, err_msg = ai.generate_quiz_from_text(source_text, num_questions=num_questions, custom_prompt=custom_prompt)
    
    if not generated:
        detail = "Failed to generate quiz using AI. Please verify your GEMINI_API_KEY environment variable is set and correct."
        if err_msg:
            detail += f" Details: {err_msg}"
        raise HTTPException(status_code=500, detail=detail)
        
    import random
    import string
    
    quiz_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    
    quiz_data = {
        "id": quiz_id,
        "title": generated.get("title", "AI Generated Quiz"),
        "category": category if category != "General" else generated.get("category", "General"),
        "questions": generated.get("questions", [])
    }
    
    db_quiz = models.Quiz(
        id=quiz_id,
        title=quiz_data["title"],
        category=quiz_data["category"],
        questions=quiz_data["questions"]
    )
    db.add(db_quiz)
    db.commit()
    
    return quiz_data


@app.delete("/api/quizzes/{quiz_id}")
def delete_quiz(quiz_id: str, db: Session = Depends(get_db)):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(db_quiz)
    db.commit()
    return {"message": "Quiz deleted"}

# --- SESSION ROUTES ---
@app.post("/api/sessions")
def create_session(session: SessionCreate, db: Session = Depends(get_db)):
    import random, string
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    new_session = models.LiveSession(id=code, quiz_id=session.quiz_id)
    db.add(new_session)
    db.commit()
    
    quiz = db.query(models.Quiz).filter(models.Quiz.id == session.quiz_id).first()
    quiz_data = None
    if quiz:
        quiz_data = {
            "id": quiz.id,
            "title": quiz.title,
            "category": quiz.category,
            "questions": quiz.questions
        }
        
    return {"id": code, "quizId": session.quiz_id, "quiz": quiz_data}

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    s = db.query(models.LiveSession).filter(models.LiveSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    
    quiz = db.query(models.Quiz).filter(models.Quiz.id == s.quiz_id).first()
    quiz_data = None
    if quiz:
        quiz_data = {
            "id": quiz.id,
            "title": quiz.title,
            "category": quiz.category,
            "questions": quiz.questions
        }
        
    return {
        "id": s.id, 
        "quizId": s.quiz_id, 
        "status": s.status, 
        "currentQuestionIndex": s.current_question_index,
        "quiz": quiz_data
    }

# --- RESULTS ROUTES ---
class ResultCreate(BaseModel):
    quiz_id: str
    participants_count: int
    avg_score: int
    created_at: str

@app.get("/api/results")
def get_results(db: Session = Depends(get_db)):
    return db.query(models.SessionResult).all()

@app.post("/api/results")
def create_result(result: ResultCreate, db: Session = Depends(get_db)):
    db_result = models.SessionResult(**result.dict())
    db.add(db_result)
    db.commit()
    return {"message": "Result saved"}

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}
        self.session_participants: dict = {} # {session_id: [names]}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)

    async def broadcast(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    continue

manager = ConnectionManager()

@app.get("/api/sessions/{session_id}/participants")
def get_participants(session_id: str):
    return manager.session_participants.get(session_id, [])

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    db = next(get_db())
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            import time
            current_time = int(time.time() * 1000) # ms precision

            # Special handling for state updates
            if message.get("type") == "PARTICIPANT_JOINED":
                payload = message.get("payload", {})
                name = payload.get("name")
                email = payload.get("email")
                if name:
                    if session_id not in manager.session_participants:
                        manager.session_participants[session_id] = []
                    # Check if already joined by email or name
                    participants = manager.session_participants[session_id]
                    # We'll store them as dicts now. Existing entries might be strings if it was running.
                    # But since we're restarting/updating, it's fine.
                    manager.session_participants[session_id].append({"name": name, "email": email})
            
            elif message.get("type") == "START_QUIZ":
                s = db.query(models.LiveSession).filter(models.LiveSession.id == session_id).first()
                if s:
                    s.status = "active"
                    db.commit()

            elif message.get("type") == "NEXT_QUESTION":
                # Update DB state
                idx = message.get("questionIndex", 0)
                s = db.query(models.LiveSession).filter(models.LiveSession.id == session_id).first()
                if s:
                    s.current_question_index = idx
                    s.current_question_start = current_time
                    s.status = "active"
                    db.commit()
            
            elif message.get("type") == "ANSWER_SUBMITTED":
                # Calculate points based on timing
                s = db.query(models.LiveSession).filter(models.LiveSession.id == session_id).first()
                if s and s.current_question_start > 0:
                    time_taken = current_time - s.current_question_start
                    # Base points 1000, decays over 20 seconds (20000ms)
                    # Formula: max(0, 1000 - (time_taken / 20000) * 500) 
                    # Giving at least 500 for a correct answer, and up to 1000 for instant
                    is_correct = message.get("payload", {}).get("isCorrect", False)
                    if is_correct:
                        # Mentimeter style: points = 1000 * (1 - (time_taken/total_time)/2)
                        # Let's assume 20s total.
                        points = max(500, int(1000 * (1 - (min(time_taken, 20000) / 40000))))
                        message["payload"]["points"] = points
                    else:
                        message["payload"]["points"] = 0
                    message["payload"]["timeTaken"] = time_taken

            await manager.broadcast(session_id, message)
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
    finally:
        db.close()
