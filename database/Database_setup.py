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