import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../storage/secure_storage.dart';

class ApiClient {
  final Dio _dio;
  final SecureStorageService _storage;

  ApiClient(this._storage) : _dio = Dio(BaseOptions(
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

  _AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final requiresAuth = options.extra['requiresAuth'] == true;
    if (requiresAuth) {
      final token = await _storage.getToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (err.response?.statusCode == 401) {
      _storage.deleteToken();
    }
    handler.next(err);
  }
}