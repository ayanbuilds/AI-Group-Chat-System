from fastapi import APIRouter, HTTPException
from app.schemas.ai import AIReplyRequest, AIReplyResponse
from app.services.llm import generate_reply, LLMError
from app.services.supabase_admin import insert_ai_message, SupabaseAdminError
from app.services.school_data import school_data_store

router = APIRouter(prefix="/ai", tags=["ai"])

def _build_context_text(req: AIReplyRequest) -> str:
    # Keep context short and readable for the model
    lines = []
    for m in req.context[-30:]:
        who = "AI" if m.role == "ai" else "User"
        lines.append(f"{who}: {m.content}")
    return "\n".join(lines).strip()

@router.post("/reply", response_model=AIReplyResponse)
async def ai_reply(req: AIReplyRequest):
    """
    PUBLIC: inserts AI reply into DB (visible to group)
    """
    try:
        # =========================================================
        # 🔹 SCHOOL DATA OVERRIDE (JSON-based answers only)
        # =========================================================
        school_answer = school_data_store.answer(req.user_question)
        if school_answer is not None:
            await insert_ai_message(req.group_id, school_answer)
            return AIReplyResponse(reply=school_answer)
        # =========================================================

        
        context_text = _build_context_text(req)
        reply = await generate_reply(req.user_question, context_text)

        # Insert AI reply into group chat (visible to everyone)
        await insert_ai_message(req.group_id, reply)

        return AIReplyResponse(reply=reply)

    except LLMError as e:
        # raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=400, detail={"message": str(e)})
    except SupabaseAdminError as e:
        # raise HTTPException(status_code=500, detail=str(e))
        raise HTTPException(status_code=500, detail={"message": str(e)})
    except Exception:
        raise HTTPException(status_code=500, detail="Unexpected server error")


@router.post("/explain", response_model=AIReplyResponse)
async def ai_explain(req: AIReplyRequest):
    """
    PRIVATE: returns explanation only (NO DB insert)
    """
    try:
        context_text = _build_context_text(req)
        reply = await generate_reply(req.user_question, context_text)

        # NO insert_ai_message here
        return AIReplyResponse(reply=reply)

    except LLMError as e:
        raise HTTPException(status_code=400, detail={"message": str(e)})
    except Exception:
        raise HTTPException(status_code=500, detail="Unexpected server error")
