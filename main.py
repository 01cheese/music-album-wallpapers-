from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WallMaker Deezer", version="3.0")
app.mount("/static", StaticFiles(directory="static"), name="static")


# ── Главная страница ─────────────────────────────────────────────
@app.get("/")
async def index():
    with open("templates/index.html", "r", encoding="utf-8") as f:
        return HTMLResponse(f.read())


# ── Поиск артистов ───────────────────────────────────────────────
@app.get("/api/search")
async def search_artists(q: str, limit: int = 16):
    if not q:
        return {"artists": []}

    url = f"https://api.deezer.com/search/artist?q={q}&limit={limit}"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            data = resp.json()
    except Exception as e:
        logger.error(f"Deezer search error: {e}")
        return {"artists": []}

    artists = [
        {
            "id": a["id"],
            "name": a["name"],
            "type": "Artist",
            "tags": [],
            "disambiguation": "",
            "picture": a.get("picture_medium", ""),
        }
        for a in data.get("data", [])
    ]

    return {"artists": artists}


# ── Альбомы артиста ─────────────────────────────────────────────
@app.get("/api/artist/{artist_id}/albums")
async def get_albums(artist_id: str):
    url = f"https://api.deezer.com/artist/{artist_id}/albums"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            data = resp.json()
    except Exception as e:
        logger.error(f"Deezer albums error: {e}")
        return {"albums": []}

    albums = []
    seen = set()

    for a in data.get("data", []):
        title = a["title"]

        # убираем дубликаты
        if title in seen:
            continue
        seen.add(title)

        # Use bigger cover image
        cover = a.get("cover_big") or a.get("cover_medium") or a.get("cover")

        albums.append({
            "id": a["id"],
            "title": title,
            "year": (a.get("release_date") or "")[:4],
            "cover": cover,
        })

    return {"albums": albums}


# ── Прокси для обложек (решает CORS) ────────────────────────────
@app.get("/api/cover")
async def proxy_cover(url: str):
    """Proxy Deezer cover images to avoid CORS issues."""
    # Only allow Deezer CDN URLs
    if not url.startswith("https://cdn-images.dzcdn.net/") and \
       not url.startswith("https://e-cdns-images.dzcdn.net/"):
        return Response(status_code=400, content="Invalid URL")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                return Response(status_code=resp.status_code)
            return Response(
                content=resp.content,
                media_type=resp.headers.get("content-type", "image/jpeg"),
                headers={"Cache-Control": "public, max-age=86400"},
            )
    except Exception as e:
        logger.error(f"Cover proxy error: {e}")
        return Response(status_code=502)


# ── Запуск ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)