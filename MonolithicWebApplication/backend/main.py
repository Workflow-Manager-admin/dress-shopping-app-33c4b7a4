import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Body, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, EmailStr
from pymongo import MongoClient
from bson import ObjectId

# ------------ MongoDB setup ------------
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.getenv("MONGODB_DB_NAME", "dress_shop")

mongo_client = MongoClient(MONGODB_URI)
db = mongo_client[MONGO_DB_NAME]
users_col = db["users"]
products_col = db["products"]
orders_col = db["orders"]

def objectid_str(oid):
    return str(oid) if isinstance(oid, ObjectId) else oid

# ---------- Pydantic Models ----------
class UserLoginModel(BaseModel):
    name: str = Field(..., description="Full name of the user")
    phone: str = Field(..., description="Phone number (unique)")
    chest_size: int = Field(..., ge=24, le=60, description="Shirt chest size (inches)")
    favorite_brand: str = Field(..., description="Favorite dress brand")

class UserModel(UserLoginModel):
    id: Optional[str] = Field(None, description="MongoDB ID")

class ProductModel(BaseModel):
    id: Optional[str] = Field(None, description="Product ID")
    name: str
    brand: str
    image_url: str
    size: int
    price: float

class CreateOrderModel(BaseModel):
    product_id: str
    user_phone: str

class OrderModel(BaseModel):
    id: Optional[str] = Field(None, description="Order ID")
    user_phone: str
    product: ProductModel
    is_paid: bool = False
    payment_url: Optional[str] = None

# ---------- FastAPI Setup -----------
app = FastAPI(
    title="Dress Shop Monolithic API",
    description="Backend API for Dress Shopping Platform (users, products, order, PhonePe integration)",
    version="1.0.0",
    openapi_tags=[
        {"name": "user", "description": "User authentication"},
        {"name": "catalog", "description": "Dress catalog browsing"},
        {"name": "order", "description": "Order management"},
        {"name": "payment", "description": "PhonePe payment"},
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PUBLIC_INTERFACE
@app.post("/api/login", summary="Login or Register User", tags=["user"])
async def login(user: UserLoginModel):
    """
    Creates or finds a user by phone number. Used for login and registration.

    - **name**: Full name of user
    - **phone**: Phone number (unique identifier)
    - **chest_size**: Shirt chest size (in inches)
    - **favorite_brand**: Favorite clothing brand

    Returns the user profile.
    """
    found = users_col.find_one({"phone": user.phone})
    if found:
        return UserModel(**found, id=objectid_str(found["_id"]))
    res = users_col.insert_one(user.dict())
    user_doc = users_col.find_one({"_id": res.inserted_id})
    return UserModel(**user_doc, id=objectid_str(user_doc["_id"]))

# PUBLIC_INTERFACE
@app.get("/api/products", summary="List Dresses", tags=["catalog"])
async def get_products(
    chest_size: Optional[int] = None,
    favorite_brand: Optional[str] = None,
    sort: Optional[str] = None,
    order: Optional[str] = "asc"
) -> List[ProductModel]:
    """
    List dresses with optional filtering and sorting.

    Query params:
    - chest_size: Filter by best chest size match
    - favorite_brand: Filter by brand name
    - sort: 'price' (currently supported)
    - order: 'asc'/'desc'

    Returns a list of product objects.
    """
    query = {}
    if chest_size:
        # Tolerate +/- 2 inches
        query["size"] = {"$gte": chest_size - 2, "$lte": chest_size + 2}
    if favorite_brand:
        query["brand"] = favorite_brand

    result = list(products_col.find(query))

    if sort == "price":
        reverse = (order == "desc")
        result = sorted(result, key=lambda x: x["price"], reverse=reverse)

    return [ProductModel(**prod, id=objectid_str(prod["_id"])) for prod in result]

# PUBLIC_INTERFACE
@app.get("/api/product/{product_id}", summary="Get Product Detail", tags=["catalog"])
async def get_product(product_id: str) -> ProductModel:
    """
    Get details of a specific dress.
    """
    prod = products_col.find_one({"_id": ObjectId(product_id)})
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductModel(**prod, id=objectid_str(prod["_id"]))

# PUBLIC_INTERFACE
@app.post("/api/order", summary="Place an Order", tags=["order"])
async def create_order(order: CreateOrderModel):
    """
    Place an order for a dress.

    - **product_id**: The ID of the product to order
    - **user_phone**: The user's phone number
    """
    user = users_col.find_one({"phone": order.user_phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    product = products_col.find_one({"_id": ObjectId(order.product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    order_doc = {
        "user_phone": order.user_phone,
        "product": product,
        "is_paid": False,
        "payment_url": None
    }
    res = orders_col.insert_one(order_doc)
    new_order = orders_col.find_one({"_id": res.inserted_id})
    return OrderModel(**new_order, id=objectid_str(new_order["_id"]))

# PUBLIC_INTERFACE
@app.post("/api/pay/{order_id}", summary="Initiate Payment", tags=["payment"])
async def pay_order(order_id: str):
    """
    Initiate PhonePe payment for an order.

    Returns a fake payment URL (stub) for frontend redirection.
    """
    order = orders_col.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("is_paid"):
        raise HTTPException(status_code=400, detail="Already paid")

    fake_phonepe_url = f"https://www.phonepe.com/pay?orderId={order_id}"

    orders_col.update_one({"_id": ObjectId(order_id)}, {"$set": {"payment_url": fake_phonepe_url}})
    order = orders_col.find_one({"_id": ObjectId(order_id)})

    return {"payment_url": order["payment_url"]}

# PUBLIC_INTERFACE
@app.post("/api/pay/success/{order_id}", summary="Confirm Payment Success", tags=["payment"])
async def pay_success(order_id: str):
    """
    Confirmation endpoint: called after successful PhonePe payment.

    Marks order as paid.
    """
    order = orders_col.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    orders_col.update_one({"_id": ObjectId(order_id)}, {"$set": {"is_paid": True}})
    return {"status": "success"}

# PUBLIC_INTERFACE
@app.get("/api/orders/{user_phone}", summary="Get My Orders", tags=["order"])
async def get_orders(user_phone: str):
    """
    List orders for the given user.
    """
    orders = list(orders_col.find({"user_phone": user_phone}))
    return [OrderModel(**order, id=objectid_str(order["_id"])) for order in orders]

# PUBLIC_INTERFACE
@app.get("/api/health", summary="API Health check", tags=["user"])
def health():
    """Simple heartbeat check."""
    return {"status": "ok"}

# ----------- Demo Data Setup (one-off) -------------
@app.post("/api/admin/demo_populate", summary="Populate demo products", tags=["admin"])
def demo_populate():
    """Populate the DB with demo dresses (idempotent)."""
    demo_products = [
        {
            "name": "Classic Red Dress",
            "brand": "Zara",
            "image_url": "/static/demo_dress_red.jpg",
            "size": 36,
            "price": 1500.0
        },
        {
            "name": "Elegant Blue Evening Gown",
            "brand": "H&M",
            "image_url": "/static/demo_dress_blue.jpg",
            "size": 38,
            "price": 2100.0
        },
        {
            "name": "Casual Printed Sundress",
            "brand": "Vero Moda",
            "image_url": "/static/demo_dress_sun.jpg",
            "size": 34,
            "price": 990.0
        }
    ]
    if products_col.count_documents({}) == 0:
        products_col.insert_many(demo_products)
    return {"status": "populated", "count": products_col.count_documents({})}

# Static files for demo images support (dev only)
@app.get("/static/{filename}", include_in_schema=False)
async def static_file(filename: str):
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    file_path = os.path.join(static_dir, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path, media_type="image/jpeg")
