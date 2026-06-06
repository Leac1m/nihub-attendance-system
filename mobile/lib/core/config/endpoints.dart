class Endpoints {
  // Auth
  static const login = '/auth/login';
  static const refresh = '/auth/refresh';
  static const logout = '/auth/logout';
  static const register = '/auth/register';
  static const verifyAccount = '/auth/verify-account';
  static const registerRegistrant = '/auth/registrants/register';
  static const verifyRegistrant = '/auth/registrants/verify';
  static const loginRegistrant = '/auth/registrants/login';

  // Departments
  static const departments = '/departments';
  static String department(String code) => '/departments/$code';
  static String departmentRegistrants(String code) => '/departments/$code/registrants';
  static String departmentRegistrant(String code, String id) => '/departments/$code/registrants/$id';
  static String departmentRegister(String code) => '/departments/$code/register';
  static String departmentAttendance(String code) => '/departments/$code/attendance';
  static String departmentAttendanceById(String code) => '/departments/$code/attendance';
  static String departmentAttendanceSpreadsheet(String code) =>
      '/departments/$code/attendance/spreadsheet';
}
