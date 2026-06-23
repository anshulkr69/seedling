from fastapi import FastAPI
from api.routes import scrape, match, draft

app = FastAPI(title="Seedling Engine", version="0.1.0")

app.include_router(scrape.router, prefix="/scrape", tags=["scraping"])
app.include_router(match.router, prefix="/match", tags=["matching"])
app.include_router(draft.router, prefix="/draft", tags=["drafting"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "seedling-engine"}
