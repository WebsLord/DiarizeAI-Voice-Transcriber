from litellm import completion
from config import Config

response = completion(
    model=Config.LLM_MODEL,
    messages=[{"role": "user", "content": "Merhaba, test ediyorum. Çalışıyor musun?"}]
)

print(response)
