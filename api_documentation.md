# Recipe API Documentation

## Overview
This API provides access to a collection of recipes with filtering, sorting, and pagination capabilities. There are two main endpoints:

1. `/api/recipes` - Get paginated list of recipes
2. `/api/recipes/search` - Search recipes with various filters

## 1. Get Recipes Endpoint
`GET /api/recipes`

### Parameters

| Parameter | Type   | Required | Default | Description                          |
|-----------|--------|----------|---------|--------------------------------------|
| page      | integer| No       | 1       | Page number (1-based)                |
| limit     | integer| No       | 15      | Number of recipes per page (1-100)   |
| sort      | string | No       | None    | Field to sort by (see sort options)  |

### Sort Options
Prefix with `-` for descending order:
- `title` - Sort by recipe title (A-Z)
- `-title` - Sort by recipe title (Z-A)
- `rating` - Sort by rating (low-high)
- `-rating` - Sort by rating (high-low)
- `total_time` - Sort by total time (short-long)
- `-total_time` - Sort by total time (long-short)
- `calories` - Sort by calories (low-high)
- `-calories` - Sort by calories (high-low)

### Example Request
```http
GET /api/recipes?page=2&limit=10&sort=-rating

Example Response
{
  "page": 2,
  "limit": 10,
  "total": 45,
  "data": [
    {
      "id": 11,
      "title": "Chocolate Cake",
      "cuisine": "Desserts",
      "rating": 4.9,
      "prep_time": 20,
      "cook_time": 40,
      "total_time": 60,
      "description": "Rich chocolate cake recipe...",
      "nutrients": {
        "calories": "350 kcal",
        "carbohydrateContent": "45 g"
      },
      "serves": "8 servings"
    }
  ]
}
2. 🔍 Search Recipes Endpoint
GET /api/recipes/search
Search recipes using various filters, with optional sorting and pagination.

🔸 Parameters
Name | Type | Location | Description
title | string | query | Filter by recipe title
cuisine | string | query | Filter by cuisine
calories | string | query | Example: <=400
total_time | string | query | Example: <=30
rating | string | query | Example: >=4.5
limit | integer | query | Max: 100, Min: 1
sort | string | query | See Sort Options

📥 Example Request
GET /api/recipes/search?calories=<=400&title=pie&rating=>=4.5&limit=5&sort=-rating

📤 Example Response
{
  "count": 2,
  "data": [
    {
      "id": 1,
      "title": "Sweet Potato Pie",
      "cuisine": "Southern Recipes",
      "rating": 4.8,
      "prep_time": 15,
      "cook_time": 100,
      "total_time": 115,
      "description": "Shared from a Southern recipe...",
      "nutrients": {
        "calories": "389 kcal",
        "carbohydrateContent": "48 g",
        "cholesterolContent": "78 mg"
      },
      "serves": "8 servings"
    },
    {
      "id": 42,
      "title": "Apple Pie",
      "cuisine": "American",
      "rating": 4.6,
      "prep_time": 30,
      "cook_time": 45,
      "total_time": 75,
      "description": "Classic American apple pie...",
      "nutrients": {
        "calories": "320 kcal",
        "carbohydrateContent": "52 g"
      },
      "serves": "6 servings"
    }
  ]
}
❌ Error Responses
🔴 400 Bad Request
{
  "detail": "Invalid sort field: invalid_field"
}

🔴 500 Internal Server Error
{
  "detail": "Internal server error"
}
