import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/auth_event_bus.dart';
import '../../../core/storage/secure_storage.dart';
import '../data/auth_api.dart';
import '../domain/auth_state.dart';

final secureStorageProvider = Provider((ref) => SecureStorageService());
final apiClientProvider = Provider((ref) => ApiClient(ref.read(secureStorageProvider)));
final authApiProvider = Provider((ref) => AuthApi(ref.read(apiClientProvider)));

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.read(authApiProvider),
    ref.read(secureStorageProvider),
  );
});

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthApi _api;
  final SecureStorageService _storage;

  AuthNotifier(this._api, this._storage) : super(const AuthState()) {
    _restoreAuth();
    // Listen for forced sign-outs from the API client (refresh failure).
    AuthEventBus().stream.listen((event) {
      if (event == AuthEvent.forceSignOut) {
        _resetToAnonymous();
      }
    });
  }

  Future<void> _restoreAuth() async {
    final access = await _storage.getAccessToken();
    final refresh = await _storage.getRefreshToken();
    if (access == null && refresh == null) {
      state = AuthState.anonymous;
      return;
    }

    // Optimistically mark the user as authenticated and decode the JWT
    // we already have so the UI can show role-specific copy immediately.
    final claims = access != null ? _decodeClaims(access) : <String, dynamic>{};
    state = _stateFromClaims(claims, isAuthenticated: true);

    // Try a silent refresh in the background. If it succeeds, the new
    // access token is saved; if it fails, the API client emits a
    // force-sign-out event and we drop back to anonymous.
    if (refresh != null) {
      unawaited(_refresh());
    } else {
      // No refresh token → can't keep the session alive. Force sign-out.
      _resetToAnonymous();
    }
  }

  Future<void> signInStaff(String email, String password) async {
    state = state.copyWith(isLoading: true);
    try {
      final data = await _api.loginStaff(email, password);
      await _persistTokens(data);
      final claims = _decodeClaims(data['access_token'] as String);
      state = _stateFromClaims(claims, isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> signInRegistrant({
    required String matriculationNumber,
    required String departmentCode,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final data = await _api.loginRegistrant(
        matriculationNumber: matriculationNumber,
        departmentCode: departmentCode,
        password: password,
      );
      await _persistTokens(data);
      final claims = _decodeClaims(data['access_token'] as String);
      state = _stateFromClaims(claims, isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> registerStaff(String email, String username, String password, {bool requestedAdmin = false}) async {
    state = state.copyWith(isLoading: true);
    try {
      await _api.registerStaff(email, username, password, requestedAdmin: requestedAdmin);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> verifyStaffAccount(String username, String code) async {
    state = state.copyWith(isLoading: true);
    try {
      final data = await _api.verifyStaffAccount(username, code);
      await _persistTokens(data);
      final claims = _decodeClaims(data['access_token'] as String);
      state = _stateFromClaims(claims, isAuthenticated: true, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  Future<void> signOut() async {
    final refresh = await _storage.getRefreshToken();
    if (refresh != null) {
      // Best-effort revocation. If the call fails (e.g. the user is
      // already offline), we still clear local state and route them
      // back to /signin.
      try {
        await _api.logout(refresh);
      } catch (_) {
        // Swallow: the local sign-out still proceeds.
      }
    }
    await _storage.clearAll();
    _resetToAnonymous();
  }

  Future<bool> _refresh() async {
    try {
      final refresh = await _storage.getRefreshToken();
      if (refresh == null) {
        _resetToAnonymous();
        return false;
      }
      final data = await _api.refresh(refresh);
      final access = data['access_token'] as String?;
      final newRefresh = data['refresh_token'] as String?;
      if (access == null || newRefresh == null) {
        return false;
      }
      await _storage.saveTokens(access: access, refresh: newRefresh);
      final claims = _decodeClaims(access);
      state = _stateFromClaims(claims, isAuthenticated: true);
      return true;
    } catch (_) {
      _resetToAnonymous();
      AuthEventBus().emit(AuthEvent.silentRefreshFailed);
      return false;
    }
  }

  Future<void> _persistTokens(Map<String, dynamic> data) async {
    final access = data['access_token'] as String?;
    final refresh = data['refresh_token'] as String?;
    if (access == null || refresh == null) return;
    await _storage.saveTokens(access: access, refresh: refresh);
  }

  void _resetToAnonymous() {
    state = AuthState.anonymous;
  }

  /// Decode the JWT payload WITHOUT verifying the signature. The server
  /// is the source of truth for token validity; the client only needs
  /// the claims for UI branching (role, name, etc.).
  Map<String, dynamic> _decodeClaims(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return const <String, dynamic>{};
      var payload = parts[1];
      // base64url → base64 with padding
      payload = payload.replaceAll('-', '+').replaceAll('_', '/');
      while (payload.length % 4 != 0) {
        payload += '=';
      }
      final decoded = utf8.decode(base64Decode(payload));
      final json = jsonDecode(decoded);
      if (json is Map) return Map<String, dynamic>.from(json);
    } catch (_) {
      // Bad token — fall through to empty claims.
    }
    return const <String, dynamic>{};
  }

  AuthState _stateFromClaims(
    Map<String, dynamic> claims, {
    required bool isAuthenticated,
    bool? isLoading,
  }) {
    final type = claims['type'] as String?;
    AuthRole role;
    String? username;
    String? matriculationNumber;
    String? departmentCode;
    String? registrantId;

    switch (type) {
      case 'staff':
        role = (claims['is_admin'] == true) ? AuthRole.admin : AuthRole.staff;
        username = claims['sub'] as String?;
        break;
      case 'registrant':
        role = AuthRole.registrant;
        matriculationNumber = claims['sub'] as String?;
        departmentCode = claims['dept'] as String?;
        registrantId = claims['rid'] as String?;
        break;
      default:
        role = AuthRole.unknown;
    }

    return AuthState(
      isAuthenticated: isAuthenticated,
      isLoading: isLoading ?? state.isLoading,
      role: role,
      username: username,
      matriculationNumber: matriculationNumber,
      departmentCode: departmentCode,
      registrantId: registrantId,
    );
  }
}
