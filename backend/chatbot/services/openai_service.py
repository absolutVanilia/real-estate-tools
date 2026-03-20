from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def ask_llm(user_message: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a real estate assistant. "
                    "Respond concisely in 1-2 sentences. "
                    "Do not add explanations unless asked."
                )            
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        max_tokens=100,
        temperature=0.2,
    )
    print(response)
    print(client)
    return response.choices[0].message.content