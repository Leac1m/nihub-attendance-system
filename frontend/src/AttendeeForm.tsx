import { useEffect, useRef, useState } from 'react';
import './AttendeeForm.css';
import { getCourses, registerAttendee, type CourseOption } from './services/attendeeAPI';

interface AttendeeFormData {
  name: string;
  email: string;
  phone: string;
  matriculationNumber: string;
  photo?: Blob;
}

interface AttendeeFormProps {
  courseCode?: string;
  onSuccess?: (registrantId: string) => void;
}

const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export function AttendeeForm({ courseCode = 'CS101', onSuccess }: AttendeeFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState(courseCode);
  const [formData, setFormData] = useState<AttendeeFormData>({
    name: '',
    email: '',
    phone: '',
    matriculationNumber: '',
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      try {
        const courseList = await getCourses();
        if (!isMounted) {
          return;
        }

        setCourses(courseList);

        if (
          courseList.length > 0 &&
          !courseList.some((course) => course.code === selectedCourseCode)
        ) {
          setSelectedCourseCode(courseList[0].code);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.matriculationNumber.trim()) {
      newErrors.matriculationNumber = 'Matriculation number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourseCode(e.target.value);
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoPreview(result);
        setPhotoFile(compressed);
        setFormData((prev) => ({
          ...prev,
          photo: compressed,
        }));
      };
      reader.readAsDataURL(compressed);
    }
  };

  const handleBack = () => {
    // Reset step 2 state
    setPhotoPreview(null);
    setPhotoFile(null);
    setErrors((prev) => {
      const { photo, ...rest } = prev;
      return rest;
    });

    setStep(1);
  };

  const handleSubmit = async () => {
    if (!photoPreview) {
      setErrors({ photo: 'Please capture or upload a photo' });
      return;
    }

    setIsLoading(true);
    setSubmitError(null);

    try {
      await registerAttendee(
        selectedCourseCode,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          matriculation_number: formData.matriculationNumber,
        },
        photoFile || undefined
      );

      setSuccessMessage(
        `Welcome ${formData.name}! You have been successfully registered.`
      );

      // Reset form after 3 seconds
      setTimeout(() => {
        setStep(1);
        setFormData({
          name: '',
          email: '',
          phone: '',
          matriculationNumber: '',
        });
        setPhotoPreview(null);
        setPhotoFile(null);
        setErrors({});
        setSuccessMessage(null);

        if (onSuccess) {
          onSuccess('');
        }
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to register attendee';
      setSubmitError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="attendee-form-container">
      <div className="attendee-form-card">
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success">
            <div className="alert-icon">✓</div>
            <div className="alert-content">
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {submitError && (
          <div className="alert alert-error">
            <div className="alert-icon">✕</div>
            <div className="alert-content">
              <p>{submitError}</p>
              <button
                className="alert-dismiss"
                onClick={() => setSubmitError(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="attendee-form-header">
          <div className="attendee-form-step-indicator">
            <span className={`step ${step === 1 ? 'active' : 'completed'}`}>1</span>
            <div className={`step-line ${step === 2 ? 'active' : ''}`}></div>
            <span className={`step ${step === 2 ? 'active' : ''}`}>2</span>
          </div>
          <h1 className="attendee-form-title">
            {step === 1 ? 'Your Details' : 'Photo Verification'}
          </h1>
          <p className="attendee-form-subtitle">
            {step === 1
              ? 'Please enter your information'
              : 'Capture or upload your photo for verification'}
          </p>
        </div>

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="attendee-form-content">
            <div className="form-group">
              <label htmlFor="courseCode" className="form-label">
                Course
              </label>
              <select
                id="courseCode"
                name="courseCode"
                value={selectedCourseCode}
                onChange={handleCourseChange}
                className="form-input"
                disabled={courses.length === 0}
              >
                {courses.length === 0 ? (
                  <option value={selectedCourseCode}>Loading courses...</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.code} value={course.code}>
                      {course.name} ({course.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`form-input ${errors.name ? 'error' : ''}`}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className={`form-input ${errors.email ? 'error' : ''}`}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className={`form-input ${errors.phone ? 'error' : ''}`}
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="matriculationNumber" className="form-label">
                Matriculation Number
              </label>
              <input
                type="text"
                id="matriculationNumber"
                name="matriculationNumber"
                value={formData.matriculationNumber}
                onChange={handleInputChange}
                placeholder="123456789"
                className={`form-input ${errors.matriculationNumber ? 'error' : ''}`}
              />
              {errors.matriculationNumber && (
                <span className="form-error">{errors.matriculationNumber}</span>
              )}
            </div>

            <button className="btn btn-primary" onClick={handleNext} disabled={isLoading}>
              Continue to Photo
            </button>
          </div>
        )}

        {/* Step 2: Photo */}
        {step === 2 && (
          <div className="attendee-form-content">
            {photoPreview ? (
              <div className="photo-preview-container">
                <img src={photoPreview} alt="Preview" className="photo-preview" />
                <div className="photo-actions">
                  <button className="btn btn-secondary" onClick={() => setPhotoPreview(null)}>
                    Retake Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="photo-capture-container">
                <div className="photo-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.83 8 9 8 7.5 8.67 7.5 9.5 8.17 11 9 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"
                      fill="currentColor"
                    />
                  </svg>
                  <p>No photo selected</p>
                </div>

                <div className="photo-buttons">
                  <button
                    className="btn btn-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            )}

            {errors.photo && <span className="form-error">{errors.photo}</span>}

            <div className="form-actions">
              <button className="btn btn-secondary" onClick={handleBack} disabled={isLoading}>
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!photoPreview || isLoading}
              >
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
