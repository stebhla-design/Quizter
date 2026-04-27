from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .models import database as models
from pydantic import BaseModel
from typing import List, Optional
import json

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
