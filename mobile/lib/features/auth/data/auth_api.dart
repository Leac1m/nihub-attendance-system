import 'package:dio/dio.dart';
import '../../../core/config/endpoints.dart';
import '../../../core/network/api_client.dart';

class AuthApi {
  final ApiClient _client;

  AuthApi(this._client);

  Future<Map<String, dynamic>> loginStaff(String email, String password) async {
    final formData = FormData.fromMap({
      'username': email,
      'password': password,
    });
    final res = await _client.post(
      Endpoints.login,
      data: formData,
      contentType: 'application/x-www-form-urlencoded',
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> registerStaff(String email, String username, String password) async {
    await _client.post(
      Endpoints.register,
      data: {'email': email, 'username': username, 'password': password},
    );
  }

  Future<Map<String, dynamic>> verifyStaffAccount(
    String username,
    String pin,
  ) async {
    final res = await _client.post(
      Endpoints.verifyAccount,
      data: {'username': username, 'pin': pin},
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> loginRegistrant({
    required String matriculationNumber,
    required String departmentCode,
    required String password,
  }) async {
    final res = await _client.post(
      Endpoints.loginRegistrant,
      data: {
        'matriculation_number': matriculationNumber,
        'department_code': departmentCode,
        'password': password,
      },
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> registerRegistrant({
    required String email,
    required String matriculationNumber,
    required String name,
    required String phone,
    required String password,
    required String departmentCode,
  }) async {
    final res = await _client.post(
      Endpoints.registerRegistrant,
      data: {
        'email': email,
        'matriculation_number': matriculationNumber,
        'name': name,
        'phone': phone,
        'password': password,
        'department_code': departmentCode,
      },
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> verifyRegistrant(String token) async {
    final res = await _client.post(
      Endpoints.verifyRegistrant,
      data: {'token': token},
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<Map<String, dynamic>> refresh(String refreshToken) async {
    final res = await _client.post(
      Endpoints.refresh,
      data: {'refresh_token': refreshToken},
    );
    return Map<String, dynamic>.from(res.data as Map);
  }

  Future<void> logout(String refreshToken) async {
    await _client.post(
      Endpoints.logout,
      data: {'refresh_token': refreshToken},
    );
  }
}
