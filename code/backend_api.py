from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, text
from typing import Optional, Annotated
import re
import logging
from pydantic import BaseModel

app = FastAPI(
    title="Recipe API",
    description="API for managing and searching recipes",
    version="1.0.0"
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = "postgresql://postgres:newpassword@localhost/recipes"
engine = create_engine(DATABASE_URL)

class ErrorResponse(BaseModel):
    detail: str

class RecipeResponse(BaseModel):
    id: int
    title: str
    cuisine: Optional[str]
    rating: Optional[float]
    prep_time: Optional[int]
    cook_time: Optional[int]
    total_time: Optional[int]
    description: Optional[str]
    nutrients: dict
    serves: Optional[str]

def extract_op_val(expression: str, is_float: bool = False):
    if not expression:
        return None, None
    match = re.match(r'(<=|>=|<|>|=)?\s*(\d+(\.\d+)?|\d+)', expression)
    if not match:
        return None, None
    op = match.group(1) or '='
    val = match.group(2)
    return op, float(val) if is_float else int(float(val))

def parse_sort_param(sort: str) -> str:
    """Parse sort parameter into SQL ORDER BY clause"""
    if not sort:
        return "rating DESC NULLS LAST"  
    
    direction = "ASC"
    if sort.startswith("-"):
        direction = "DESC"
        sort = sort[1:]
    
    
    field_map = {
        "title": "title",
        "rating": "rating",
        "total_time": "total_time",
        "calories": "CAST(REPLACE(nutrients->>'calories', ' kcal', '') AS INTEGER)"
    }
    
    if sort not in field_map:
        raise ValueError(f"Invalid sort field: {sort}")
    
    return f"{field_map[sort]} {direction} NULLS LAST"

@app.get("/", include_in_schema=False)
def root():
    return {"message": "Welcome to the Recipe API. Visit /docs for Swagger UI."}

@app.get(
    "/api/recipes",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid sort parameter"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
def get_recipes(
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 15,
    sort: Optional[str] = None
):
    """Get paginated list of recipes with optional sorting"""
    offset = (page - 1) * limit
    
    try:
        order_by = parse_sort_param(sort)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    try:
        with engine.connect() as conn:
            #  total count
            total = conn.execute(text("SELECT COUNT(*) FROM recipes")).scalar()
            
            #  paginated results
            result = conn.execute(text(f"""
                SELECT * FROM recipes
                ORDER BY {order_by}
                LIMIT :limit OFFSET :offset
            """), {"limit": limit, "offset": offset})
            
            data = [dict(row._mapping) for row in result]
            
        return {
            "page": page,
            "limit": limit,
            "total": total,
            "data": data
        }
    except Exception as e:
        logger.error(f"Error fetching recipes: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get(
    "/api/recipes/search",
    response_model=dict,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid sort parameter"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    }
)
def search_recipes(
    title: Optional[str] = None,
    cuisine: Optional[str] = None,
    calories: Optional[str] = None,
    total_time: Optional[str] = None,
    rating: Optional[str] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    sort: Optional[str] = None
):
    """Search recipes with various filters and sorting"""
    query = "SELECT * FROM recipes WHERE TRUE"
    params = {}

    if title:
        query += " AND LOWER(title) LIKE LOWER(:title)"
        params["title"] = f"%{title}%"

    if cuisine:
        query += " AND LOWER(cuisine) = LOWER(:cuisine)"
        params["cuisine"] = cuisine

    if total_time:
        op, val = extract_op_val(total_time)
        if op and val is not None:
            query += f" AND total_time {op} :total_time"
            params["total_time"] = val

    if rating:
        op, val = extract_op_val(rating, is_float=True)
        if op and val is not None:
            query += f" AND rating {op} :rating"
            params["rating"] = val

    if calories:
        op, val = extract_op_val(calories)
        if op and val is not None:
            # Handle cases where calories might be stored as "389 kcal" or just "389"
            query += f"""
            AND (
                CASE 
                    WHEN nutrients->>'calories' LIKE '% kcal%' THEN 
                        CAST(REPLACE(nutrients->>'calories', ' kcal', '') AS INTEGER)
                    ELSE 
                        CAST(nutrients->>'calories' AS INTEGER)
                END
            ) {op} :calories
            """
            params["calories"] = val

    try:
        order_by = parse_sort_param(sort)
        query += f" ORDER BY {order_by}"
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    query += " LIMIT :limit"
    params["limit"] = limit

    try:
        with engine.connect() as conn:
            logger.info(f"Executing query: {query} with params: {params}")
            result = conn.execute(text(query), params)
            data = [dict(row._mapping) for row in result]
            
            
            logger.info(f"Found {len(data)} recipes matching criteria")
            
        return {
            "count": len(data),
            "data": data
        }
    except Exception as e:
        logger.error(f"Error searching recipes: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")