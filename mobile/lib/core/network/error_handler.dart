import 'package:dio/dio.dart';

class ErrorHandler {
  static String getMessage(dynamic e) {
    if (e is DioException) {
      if (e.response != null) {
        final data = e.response?.data;
        if (data is Map) {
          if (data['detail'] != null) {
            return data['detail'].toString();
          }
          if (data['message'] != null) {
            return data['message'].toString();
          }
        }
        return 'Server Error: ${e.response?.statusCode}';
      } else if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
        return 'Connection timed out. Please try again.';
      } else if (e.type == DioExceptionType.connectionError) {
        return 'Network connection error. Please check your internet connection.';
      }
      return e.message ?? 'An unknown network error occurred.';
    }
    return e.toString();
  }
}
