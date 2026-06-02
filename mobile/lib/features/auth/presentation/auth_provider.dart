import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../data/auth_api.dart';
import '../domain/auth_state.dart';

final secureStorageProvider = Provider((ref) => SecureStorageService());
final apiClientProvider = Provider((ref) => ApiClient(ref.read(secureStorageProvider)));
final authApiProvider = Provider((ref) => AuthApi(ref.read(apiClientProvider)));

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.read(authApiProvider), ref.read(secureStorageProvider));
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthApi _api;
  final SecureStorageService _storage;

  AuthNotifier(this._api, this._storage) : super(const AuthState()) {
    _restoreAuth();
  }

  Future<void> _restoreAuth() async {
    final token = await _storage.getToken();
    state = state.copyWith(isAuthenticated: token != null, isLoading: false);
  }

  Future<void> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      final data = await _api.login(email, password);
      await _storage.saveToken(data['access_token']);
      state = state.copyWith(isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> register(String email, String username, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      await _api.register(email, username, password);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> verifyAccount(String username, String code) async {
    state = state.copyWith(isLoading: true);
    try {
      final data = await _api.verifyAccount(username, code);
      await _storage.saveToken(data['access_token']);
      state = state.copyWith(isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _storage.deleteToken();
    state = const AuthState(isAuthenticated: false, isLoading: false);
  }
}
