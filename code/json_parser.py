import json
import math
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def safe_float(val):
    try:
        f = float(val)
        return None if math.isnan(f) else f
    except (ValueError, TypeError):
        return None

def safe_int(val):
    try:
        return int(float(val)) if val is not None else None
    except (ValueError, TypeError):
        return None

def clean_data(json_path):
    with open(json_path) as f:
        data = json.load(f)

    cleaned = []
    skipped = 0
    
    for _, recipe in data.items():
        if not recipe.get("title"):
            skipped += 1
            logger.warning(f"Skipping recipe with missing title")
            continue
            
        try:
            cleaned.append({
                "cuisine": recipe.get("cuisine"),
                "title": recipe["title"],
                "rating": safe_float(recipe.get("rating")),
                "prep_time": safe_int(recipe.get("prep_time")),
                "cook_time": safe_int(recipe.get("cook_time")),
                "total_time": safe_int(recipe.get("total_time")),
                "description": recipe.get("description"),
                "nutrients": recipe.get("nutrients") or {},
                "serves": recipe.get("serves")
            })
        except Exception as e:
            skipped += 1
            logger.error(f"Error processing recipe {recipe.get('title')}: {str(e)}")

    logger.info(f"Cleaned {len(cleaned)} recipes, skipped {skipped}")
    return cleaned

if __name__ == "__main__":
    cleaned = clean_data("US_recipes_null.Pdf.json")
    with open("cleaned_recipes.json", "w") as out:
        json.dump(cleaned, out, indent=2)
    print("[\u2714] Cleaned data written to cleaned_recipes.json")