import psycopg2
import json

conn = psycopg2.connect(
    dbname="recipes", user="postgres", password="newpassword", host="localhost", port="5432"
)
cur = conn.cursor()

with open("cleaned_recipes.json") as f:
    recipes = json.load(f)

for r in recipes:
    try:
        cur.execute("""
            INSERT INTO recipes (cuisine, title, rating, prep_time, cook_time, total_time, description, nutrients, serves)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            r["cuisine"], r["title"], r["rating"], r["prep_time"],
            r["cook_time"], r["total_time"], r["description"],
            json.dumps(r["nutrients"]), r["serves"]
        ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f" Error inserting row with title: {r.get('title')}. Skipped. Reason: {e}")

cur.close()
conn.close()

