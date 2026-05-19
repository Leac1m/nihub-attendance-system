import os
from datetime import date

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
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
    return {"courses": service.list_courses()}


@app.get("/courses/{course_code}/registrants")
async def get_course_registrants(
    course_code: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        return {
            "course_code": course_code,
            "registrants": service.get_registrants(course_code),
        }
    except CourseNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/courses/{course_code}/register")
async def register_for_course(course_code: str, registrant: RegistrantCreate):
    try:
        created = service.register(course_code, registrant.model_dump())
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
