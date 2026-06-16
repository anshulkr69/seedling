from fastapi import FastAPI

app = FastAPI(title="Seedling Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "seedling-engine"}


# TODO (Friend A): Mount routers as you build them:
# from api.routes import match, draft, scrape
# app.include_router(match.router)
# app.include_router(draft.router)
# app.include_router(scrape.router)

# TODO (Anshu): The scrape router goes here once engine/scraping/ is ready
