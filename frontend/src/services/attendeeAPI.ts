export interface RegistrantData {
  name: string;
  email: string;
  phone: string;
  matriculation_number: string;
}

export interface CourseOption {
  name: string;
  code: string;
}

export interface RegistrationResponse {
  message: string;
  registrant: {
    id: string;
    name: string;
    email: string;
    phone: string;
    matriculation_number: string;
    qr_code_url: string;
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
  data: RegistrantData,
  imageFile?: File
): Promise<RegistrationResponse> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('matriculation_number', data.matriculation_number);

  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(
    `/api/courses/${courseCode}/register`,
    {
      method: 'POST',
      body: formData,
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
  const response = await fetch('/api/courses');
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }

  const data: { courses?: CourseOption[] } = await response.json();
  return data.courses ?? [];
}
