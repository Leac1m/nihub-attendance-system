import 'dart:async';

import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../storage/secure_storage.dart';
import 'auth_event_bus.dart';

class ApiClient {
  final Dio _dio;
  final SecureStorageService _storage;

  ApiClient(this._storage)
      : _dio = Dio(BaseOptions(
          // baseUrl is set dynamically per request via _BaseUrlInterceptor
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(_BaseUrlInterceptor());
    _dio.interceptors.add(_AuthInterceptor(_storage, _dio));
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = false,
  }) {
    return _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: Options(
        extra: {'requiresAuth': requiresAuth},
      ),
    );
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    bool requiresAuth = false,
    String? contentType,
  }) {
    return _dio.post<T>(
      path,
      data: data,
      options: Options(
        extra: {'requiresAuth': requiresAuth},
        contentType: contentType,
      ),
    );
  }

  Future<Response<T>> delete<T>(
    String path, {
    bool requiresAuth = false,
  }) {
    return _dio.delete<T>(
      path,
      options: Options(
        extra: {'requiresAuth': requiresAuth},
      ),
    );
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    bool requiresAuth = false,
  }) {
    return _dio.put<T>(
      path,
      data: data,
      options: Options(
        extra: {'requiresAuth': requiresAuth},
      ),
    );
  }

  Future<Response<List<int>>> getBytes(
    String path, {
    bool requiresAuth = false,
  }) {
    return _dio.get<List<int>>(
      path,
      options: Options(
        extra: {'requiresAuth': requiresAuth},
        responseType: ResponseType.bytes,
      ),
    );
  }

  Future<Response> download(
    String path,
    String savePath, {
    bool requiresAuth = false,
    void Function(int, int)? onReceiveProgress,
  }) {
    return _dio.download(
      path,
      savePath,
      options: Options(
        extra: {'requiresAuth': requiresAuth},
      ),
      onReceiveProgress: onReceiveProgress,
    );
  }
}

class _BaseUrlInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    options.baseUrl = ApiConfig.baseUrl;
    handler.next(options);
  }
}

class _AuthInterceptor extends Interceptor {
  final SecureStorageService _storage;
  final Dio _dio;
  Completer<bool>? _refreshing;

  _AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final requiresAuth = options.extra['requiresAuth'] == true;
    if (requiresAuth) {
      final token = await _storage.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final isAuthCall = err.requestOptions.extra['requiresAuth'] == true;
    final alreadyRetried = err.requestOptions.extra['_retried'] == true;
    final isRefreshCall = err.requestOptions.extra['_isRefresh'] == true;

    if (err.response?.statusCode != 401 ||
        !isAuthCall ||
        alreadyRetried ||
        isRefreshCall) {
      return handler.next(err);
    }

    final ok = await _refresh();
    if (!ok) {
      AuthEventBus().emit(AuthEvent.forceSignOut);
      return handler.next(err);
    }

    // Retry the original request once with the freshly issued access token.
    final req = err.requestOptions;
    req.extra['_retried'] = true;
    final newToken = await _storage.getAccessToken();
    if (newToken != null) {
      req.headers['Authorization'] = 'Bearer $newToken';
    }
    try {
      final response = await _dio.fetch<dynamic>(req);
      return handler.resolve(response);
    } catch (_) {
      return handler.next(err);
    }
  }

  Future<bool> _refresh() async {
    // Coalesce concurrent 401s into a single refresh call.
    if (_refreshing != null) return _refreshing!.future;

    final completer = Completer<bool>();
    _refreshing = completer;
    try {
      final refresh = await _storage.getRefreshToken();
      if (refresh == null) {
        completer.complete(false);
        return completer.future;
      }
      final res = await _dio.post<dynamic>(
        '/auth/refresh',
        data: {'refresh_token': refresh},
        options: Options(
          extra: {
            'requiresAuth': false,
            '_isRefresh': true,
            '_retried': true,
          },
        ),
      );
      final data = res.data;
      if (data is! Map) {
        completer.complete(false);
        return completer.future;
      }
      final access = data['access_token'] as String?;
      final newRefresh = data['refresh_token'] as String?;
      if (access == null || newRefresh == null) {
        completer.complete(false);
        return completer.future;
      }
      await _storage.saveTokens(access: access, refresh: newRefresh);
      completer.complete(true);
    } catch (_) {
      completer.complete(false);
    } finally {
      _refreshing = null;
    }
    return completer.future;
  }
}
