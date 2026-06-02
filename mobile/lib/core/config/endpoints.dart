class Endpoints {
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const verifyAccount = '/auth/verify-account';
  static const courses = '/courses';
  static String course(String code) => '/courses/$code';
  static String courseRegistrants(String code) => '/courses/$code/registrants';
  static String courseRegistrant(String code, String id) => '/courses/$code/registrants/$id';
  static String courseRegister(String code) => '/courses/$code/register';
  static String courseAttendance(String code) => '/courses/$code/attendance';
  static String courseAttendanceById(String code) => '/courses/$code/attendance';
  static String courseAttendanceSpreadsheet(String code) =>
      '/courses/$code/attendance/spreadsheet';
}
