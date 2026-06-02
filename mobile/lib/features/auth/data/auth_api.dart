import 'package:dio/dio.dart';
import '../../../core/config/endpoints.dart';
import '../../../core/network/api_client.dart';

class AuthApi {
  final ApiClient _client;

  AuthApi(this._client);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final formData = FormData.fromMap({
      'username': email,
      'password': password,
    });
    final res = await _client.post(
      Endpoints.login,
      data: formData,
      contentType: 'application/x-www-form-urlencoded',
    );
    return res.data;
  }

  Future<void> register(String email, String username, String password) async {
    await _client.post(
      Endpoints.register,
      data: {'email': email, 'username': username, 'password': password},
    );
  }

  Future<Map<String, dynamic>> verifyAccount(String username, String pin) async {
    final res = await _client.post(
      Endpoints.verifyAccount,
      data: {'username': username, 'pin': pin},
    );
    return res.data;
  }
}
