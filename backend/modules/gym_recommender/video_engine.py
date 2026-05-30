import os
import urllib.parse
import urllib.request
import json
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")


def search_youtube_videos(query: str, max_results: int = 3) -> list:
    """
    Search YouTube for fitness videos related to the query.
    Returns list of video info dicts.
    """
    if not YOUTUBE_API_KEY:
        # Fallback: return static curated links if no API key
        return get_fallback_videos(query)

    try:
        encoded_query = urllib.parse.quote(f"fitness workout {query}")
        url = (
            f"https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet"
            f"&q={encoded_query}"
            f"&type=video"
            f"&maxResults={max_results}"
            f"&videoCategoryId=17"
            f"&key={YOUTUBE_API_KEY}"
        )

        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())

        videos = []
        for item in data.get("items", []):
            video_id = item["id"]["videoId"]
            snippet  = item["snippet"]
            videos.append({
                "title":       snippet["title"],
                "channel":     snippet["channelTitle"],
                "description": snippet["description"][:100] + "...",
                "url":         f"https://www.youtube.com/watch?v={video_id}",
                "thumbnail":   snippet["thumbnails"]["medium"]["url"]
            })
        return videos

    except Exception as e:
        print(f"YouTube API error: {e}")
        return get_fallback_videos(query)


def get_fallback_videos(query: str) -> list:
    """
    Curated static video recommendations when no API key.
    Maps common goals to relevant YouTube videos.
    """
    query_lower = query.lower()

    if any(w in query_lower for w in ["squat", "leg", "lower"]):
        return [
            {"title": "Perfect Squat Form for Beginners",
             "channel": "Jeff Nippard",
             "url": "https://www.youtube.com/watch?v=ultWZbUMPL8",
             "description": "Science-based squat tutorial"},
            {"title": "30-Day Squat Challenge",
             "channel": "FitnessBlender",
             "url": "https://www.youtube.com/watch?v=aclHkVaku9U",
             "description": "Daily squat program"}
        ]
    elif any(w in query_lower for w in ["weight loss", "fat", "cardio", "burn"]):
        return [
            {"title": "20 Min Full Body HIIT Workout",
             "channel": "MadFit",
             "url": "https://www.youtube.com/watch?v=ml6cT4AZdqI",
             "description": "High intensity fat burning workout"},
            {"title": "Best Cardio for Weight Loss",
             "channel": "Jeff Nippard",
             "url": "https://www.youtube.com/watch?v=YIYPOA4gBOA",
             "description": "Science-based cardio guide"}
        ]
    elif any(w in query_lower for w in ["muscle", "strength", "bulk", "gain"]):
        return [
            {"title": "Full Body Strength Training for Beginners",
             "channel": "AthleanX",
             "url": "https://www.youtube.com/watch?v=ixkQaZXVQjs",
             "description": "Complete strength program"},
            {"title": "How to Build Muscle (Science Explained)",
             "channel": "Jeff Nippard",
             "url": "https://www.youtube.com/watch?v=2tM1LFFxeKg",
             "description": "Evidence-based muscle building guide"}
        ]
    elif any(w in query_lower for w in ["yoga", "flexibility", "stretch"]):
        return [
            {"title": "Morning Yoga for Beginners",
             "channel": "Yoga with Adriene",
             "url": "https://www.youtube.com/watch?v=v7AYKMP6rOE",
             "description": "Gentle morning yoga flow"},
            {"title": "Full Body Stretch Routine",
             "channel": "MadFit",
             "url": "https://www.youtube.com/watch?v=g_tea8ZNk5A",
             "description": "15 min flexibility routine"}
        ]
    elif any(w in query_lower for w in ["beginner", "start", "new"]):
        return [
            {"title": "Beginner Workout Plan — Week 1",
             "channel": "FitnessBlender",
             "url": "https://www.youtube.com/watch?v=mmq5zZfmIws",
             "description": "Perfect starting point for beginners"},
            {"title": "How to Start Working Out",
             "channel": "Jeff Nippard",
             "url": "https://www.youtube.com/watch?v=p_KMxpnagqU",
             "description": "Complete beginner guide"}
        ]
    else:
        return [
            {"title": "Full Body Workout for All Levels",
             "channel": "FitnessBlender",
             "url": "https://www.youtube.com/watch?v=mmq5zZfmIws",
             "description": "Complete full body routine"},
            {"title": "The Perfect Workout Routine",
             "channel": "AthleanX",
             "url": "https://www.youtube.com/watch?v=pqqlTMcCxIw",
             "description": "Science-based workout plan"}
        ]