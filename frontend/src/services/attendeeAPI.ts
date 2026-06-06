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
}

/**
 * Register a new attendee for a department.
 */
export async function registerAttendee(
  courseCode: string,
  data: RegistrantData,
  imageFile?: File
): Promise<void> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('matriculation_number', data.matriculation_number);

  if (imageFile) {
    formData.append('image', imageFile);
  }

  const response = await fetch(
    `/api/departments/${encodeURIComponent(courseCode)}/register`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    let detail = 'Registration failed';
    try {
      const err = await response.json();
      detail = err.detail || detail;
    } catch {
      /* not JSON */
    }
    throw new Error(detail);
  }
}

/**
 * Get list of departments.
 */
export async function getCourses() {
  const response = await fetch('/api/departments');
  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }

  const data: { departments?: CourseOption[] } = await response.json();
  return data.departments ?? [];
}
