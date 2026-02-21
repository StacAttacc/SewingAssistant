from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
# ScrapeGraphAI graph config using local Ollama
SCRAPER_CONFIG = {
    "llm": {
        "model": f"ollama/{OLLAMA_MODEL}",
        "base_url": OLLAMA_BASE_URL,
    },
    "embeddings": {
        "model": f"ollama/nomic-embed-text",
        "base_url": OLLAMA_BASE_URL,
    },
    "verbose": False,
    "headless": True,
}
