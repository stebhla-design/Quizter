import os
import json
import random
from typing import Optional, Dict, Tuple
import google.generativeai as genai


def _shuffle_options(question: Dict) -> None:
    """Shuffle a question's options in place and remap correctAnswers indices.

    LLMs tend to place the correct answer in a fixed slot (e.g. always option C).
    Shuffling here guarantees the correct answer lands in a random position while
    keeping correctAnswers pointing at the right option(s).
    """
    options = question.get("options")
    if not isinstance(options, list) or len(options) < 2:
        return

    correct = set(question.get("correctAnswers", []))
    # Pair each option with whether it is a correct answer, then shuffle the pairs.
    paired = [(opt, idx in correct) for idx, opt in enumerate(options)]
    random.shuffle(paired)

    question["options"] = [opt for opt, _ in paired]
    question["correctAnswers"] = [i for i, (_, is_correct) in enumerate(paired) if is_correct]

def generate_quiz_from_text(text: str, num_questions: int = 5, custom_prompt: str = "") -> Tuple[Optional[Dict], Optional[str]]:
    """
    Calls the Gemini API (using gemini-2.5-flash) to generate a structured multiple-choice quiz
    from the provided text.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is not set.")
        return None, "GEMINI_API_KEY environment variable is not set."
        
    genai.configure(api_key=api_key)
    
    system_instruction = (
        "You are an expert quiz content generator. Generate a highly engaging multiple-choice quiz based on the provided document text.\n"
        "You must output a single, raw, valid JSON object following this exact schema:\n"
        "{\n"
        "  \"title\": \"A concise, engaging title for the quiz\",\n"
        "  \"category\": \"The main topic of the quiz (e.g. Science, History, Tech, General)\",\n"
        "  \"questions\": [\n"
        "    {\n"
        "      \"id\": \"string (e.g., 'q1', 'q2', etc.)\",\n"
        "      \"type\": \"select\",\n"
        "      \"text\": \"The clear, educational question text\",\n"
        "      \"options\": [\n"
        "        \"Four distinct, plausible options (exactly 4 options)\"\n"
        "      ],\n"
        "      \"correctAnswers\": [0], // Array of 0-based index/indices of the correct answer(s) in options\n"
        "      \"timerSeconds\": 20, // recommended integer time to answer (20, 30, or 60)\n"
        "      \"points\": 1000 // recommended integer points (1000 or 2000)\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Ensure the quiz has exactly the requested number of questions and that all questions are directly answered or derived from the source material. "
        "Each question should have exactly 4 options. Make sure the correctAnswers indexes are correct. Do not include markdown wraps."
    )
    
    # Configure model using gemini-2.5-flash
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config={
            "response_mime_type": "application/json",
        }
    )
    
    prompt = f"Generate a quiz with exactly {num_questions} questions from the following source material.\n"
    if custom_prompt:
        prompt += f"Special Focus/Custom Instructions: {custom_prompt}\n"
    
    # Cap source text length to roughly 40,000 characters to prevent excessive tokens
    prompt += f"\n--- SOURCE MATERIAL ---\n{text[:40000]}"
    
    try:
        response = model.generate_content([system_instruction, prompt])
        result = json.loads(response.text)
        
        # Post-process questions to enforce correct data types and IDs
        questions = result.get("questions", [])
        for i, q in enumerate(questions):
            q["id"] = f"q{i+1}"
            q["type"] = "select"
            
            # Ensure correctAnswers are integers
            if "correctAnswers" in q:
                q["correctAnswers"] = [int(x) for x in q["correctAnswers"]]
            else:
                q["correctAnswers"] = [0]
                
            if "timerSeconds" not in q:
                q["timerSeconds"] = 20
            else:
                q["timerSeconds"] = int(q["timerSeconds"])
                
            if "points" not in q:
                q["points"] = 1000
            else:
                q["points"] = int(q["points"])

            # Randomize answer positions so the correct option isn't always in the same slot.
            _shuffle_options(q)

        result["questions"] = questions
        return result, None
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return None, str(e)
