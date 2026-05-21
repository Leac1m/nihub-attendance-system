import os
from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Depends, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordRequestForm

from course_service import (
    AttendanceAlreadyMarkedError,
    CourseNotFoundError,
    CourseService,
    RegistrantExistsError,
    RegistrantNotFoundError,
)

from staff_auth import (
    StaffAuthService,
    StaffPublic,
    StaffNotFoundError,
    InvalidCredentialsError,
    oauth2_scheme,
)

app = FastAPI()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create qr_codes directory if it doesn't exist
QR_DIR = Path("qr_codes")
QR_DIR.mkdir(exist_ok=True)

# Add CORS middleware to allow requests from mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Web
        "http://localhost:8100",  # Web (alt)
        "http://127.0.0.1:8081",
        "http://10.0.2.2:8081",   # Android emulator (points to host)
        "*",  # For development; restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files as static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve QR code images as static files
app.mount("/qr_codes", StaticFiles(directory="qr_codes"), name="qr_codes")

service = CourseService()
auth_service = StaffAuthService(secret_key=os.getenv("JWT_SECRET", "dev-secret-change-me"))

class AttendanceRecord(BaseModel):
    date: date
    present: bool = True


class RegistrantCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    matriculation_number: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def get_current_staff(token: str = Depends(oauth2_scheme)) -> StaffPublic:
    try:
        payload = auth_service.decode_access_token(token)
        username = payload.get("sub")
        if not username:
            raise InvalidCredentialsError("Invalid token subject")

        staff = auth_service.find_staff_by_username(username)
        if not staff:
            raise StaffNotFoundError("Staff account not found")

        return StaffPublic(
            username=staff["username"],
            name=staff["name"],
            email=staff["email"],
        )
    except (InvalidCredentialsError, StaffNotFoundError):
        raise HTTPException(status_code=401, detail="Could not validate credentials")


@app.get("/")
async def root():
    return {"message": "Attendance API"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/courses")
async def get_courses():
    courses = service.list_courses()
    return {
        "courses": [
            {
                "name": course.get("name") or course.get("course_name") or "",
                "code": course.get("code") or course.get("course_code") or "",
                "description": course.get("description", ""),
                "duration": course.get("duration", ""),
            }
            for course in courses
        ]
    }


@app.get("/courses/{course_code}/registrants")
async def get_course_registrants(
    course_code: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        return {
            "code": course_code,
            "registrants": service.get_registrants(course_code),
        }
    except CourseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/courses/{course_code}/registrants/{registrant_id}")
async def get_course_registrant(
    course_code: str,
    registrant_id: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        return {
            "code": course_code,
            "registrant": service.get_registrant(course_code, registrant_id),
        }
    except CourseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RegistrantNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/courses/{course_code}/scan-context")
async def get_course_scan_context(course_code: str):
    try:
        return service.get_scan_context(course_code)
    except CourseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RegistrantNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/courses/{course_code}/register")
async def register_for_course(
    course_code: str,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    matriculation_number: str = Form(...),
    image: UploadFile | None = File(None),
):
    try:
        image_filename = None
        
        # Save uploaded image if provided
        if image:
            # Generate unique filename
            file_extension = Path(image.filename).suffix if image.filename else ".jpg"
            image_filename = f"{uuid4().hex}{file_extension}"
            
            # Save file to uploads directory
            file_path = UPLOAD_DIR / image_filename
            content = await image.read()
            with open(file_path, "wb") as f:
                f.write(content)
        
        # Register the attendee
        registrant_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "matriculation_number": matriculation_number,
            "image_url": f"/uploads/{image_filename}" if image_filename else None,
        }
        
        created = service.register(course_code, registrant_data)
        return {"message": "Registration saved", "registrant": created}
    except CourseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RegistrantExistsError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/courses/{course_code}/attendance/{matric_number}")
async def mark_attendance(
    course_code: str,
    matric_number: str,
    record: AttendanceRecord,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        attendance = service.mark_attendance(
            course_code=course_code,
            matric_number=matric_number,
            attendance_date=record.date,
            present=record.present,
        )
        return {"message": "Attendance recorded", "attendance": attendance}
    except CourseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RegistrantNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AttendanceAlreadyMarkedError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        staff = auth_service.authenticate(form_data.username, form_data.password)
        token = auth_service.create_access_token(subject=staff["username"])
        return {"access_token": token, "token_type": "bearer"}
    except (StaffNotFoundError, InvalidCredentialsError):
        raise HTTPException(status_code=401, detail="Invalid username or password")
