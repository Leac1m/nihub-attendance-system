import 'dart:convert';

import 'package:attendance_tracker_flutter/features/auth/data/auth_api.dart';
import 'package:attendance_tracker_flutter/features/auth/domain/auth_state.dart';
import 'package:attendance_tracker_flutter/features/auth/presentation/auth_provider.dart';
import 'package:attendance_tracker_flutter/core/storage/secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

class _InMemoryStorage implements SecureStorageService {
  final Map<String, String> _store = {};

  @override
  Future<void> saveTokens(
      {required String access, required String refresh}) async {
    _store['access_token'] = access;
    _store['refresh_token'] = refresh;
  }

  @override
  Future<String?> getAccessToken() async => _store['access_token'];

  @override
  Future<String?> getRefreshToken() async => _store['refresh_token'];

  @override
  Future<void> clearAll() async => _store.clear();
}

String _fakeJwt(Map<String, dynamic> payload) {
  String b64(Map<String, dynamic> m) =>
      base64Url.encode(utf8.encode(jsonEncode(m))).replaceAll('=', '');
  return '${b64({'alg': 'HS256', 'typ': 'JWT'})}.${b64(payload)}.signature';
}

class _FakeAuthApi implements AuthApi {
  Map<String, dynamic>? nextRefreshResponse;
  Object? refreshShouldThrow;
  int refreshCalls = 0;

  @override
  Future<Map<String, dynamic>> refresh(String refreshToken) async {
    refreshCalls++;
    if (refreshShouldThrow != null) throw refreshShouldThrow!;
    return nextRefreshResponse ?? <String, dynamic>{};
  }

  @override
  dynamic noSuchMethod(Invocation invocation) =>
      throw UnimplementedError('Fake: ${invocation.memberName}');
}

void main() {
  group('AuthNotifier restore + silent refresh', () {
    test('starts anonymous when no tokens are saved', () async {
      final storage = _InMemoryStorage();
      final notifier = AuthNotifier(_FakeAuthApi(), storage);
      await Future<void>.delayed(Duration.zero);
      expect(notifier.state.isAuthenticated, isFalse);
      expect(notifier.state.role, AuthRole.unknown);
    });

    test('decodes staff JWT and decodes admin role from is_admin=true', () async {
      final storage = _InMemoryStorage();
      await storage.saveTokens(
        access: _fakeJwt({
          'sub': 'alice',
          'type': 'staff',
          'is_admin': true,
        }),
        refresh: 'fake-refresh',
      );
      final notifier = AuthNotifier(_FakeAuthApi(), storage);
      await Future<void>.delayed(Duration.zero);
      expect(notifier.state.isAuthenticated, isTrue);
      expect(notifier.state.role, AuthRole.admin);
      expect(notifier.state.username, 'alice');
    });

    test('decodes registrant JWT and exposes matric + dept', () async {
      final storage = _InMemoryStorage();
      await storage.saveTokens(
        access: _fakeJwt({
          'sub': '21A1234',
          'type': 'registrant',
          'rid': 'r-1',
          'dept': 'CS101',
        }),
        refresh: 'fake-refresh',
      );
      final notifier = AuthNotifier(_FakeAuthApi(), storage);
      await Future<void>.delayed(Duration.zero);
      expect(notifier.state.role, AuthRole.registrant);
      expect(notifier.state.matriculationNumber, '21A1234');
      expect(notifier.state.departmentCode, 'CS101');
    });

    test('silent refresh on launch persists new tokens', () async {
      final storage = _InMemoryStorage();
      await storage.saveTokens(access: 'old-access', refresh: 'old-refresh');

      final api = _FakeAuthApi();
      api.nextRefreshResponse = {
        'access_token': _fakeJwt({'sub': 'bob', 'type': 'staff'}),
        'refresh_token': 'new-refresh',
      };

      final notifier = AuthNotifier(api, storage);
      await Future<void>.delayed(const Duration(milliseconds: 50));
      expect(api.refreshCalls, 1);
      expect(await storage.getAccessToken(), isNot('old-access'));
      expect(await storage.getRefreshToken(), 'new-refresh');
      expect(notifier.state.isAuthenticated, isTrue);
      expect(notifier.state.username, 'bob');
    });

    test('silent refresh failure resets to anonymous', () async {
      final storage = _InMemoryStorage();
      await storage.saveTokens(access: 'stale-access', refresh: 'stale-refresh');

      final api = _FakeAuthApi();
      api.refreshShouldThrow = Exception('network down');

      final notifier = AuthNotifier(api, storage);
      await Future<void>.delayed(const Duration(milliseconds: 50));
      expect(notifier.state.isAuthenticated, isFalse);
      expect(notifier.state.role, AuthRole.unknown);
    });
  });
}