const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface RegistrantData {
  name: string;
  email: string;
  phone: string;
  matriculation_number: string;
}

export interface RegistrationResponse {
  message: string;
  registrant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    matriculation_number: string;
    attendance_days?: Array<{
      date: string;
      present: boolean;
    }>;
  };
}

/**
 * Register a new attendee for a course
 */
export async function registerAttendee(
  courseCode: string,
  data: RegistrantData
): Promise<RegistrationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseCode}/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

/**
 * Get list of courses
 */
export async function getCourses() {
  const response = await fetch(`${API_BASE_URL}/courses`);
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
}
