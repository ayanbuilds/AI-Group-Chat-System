from pydantic import BaseModel, Field
from typing import List, Literal, Optional

Role = Literal["user", "ai"]

class ContextMsg(BaseModel):
    role: Role
    content: str
    sender_id: Optional[str] = None
    created_at: Optional[str] = None

class AIReplyRequest(BaseModel):
    group_id: str = Field(..., description="Supabase group UUID")
    user_question: str = Field(..., description="The @AI question text")
    context: List[ContextMsg] = Field(default_factory=list, description="Last N messages")

class AIReplyResponse(BaseModel):
    reply: str
