import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';

class ApiConfig {
  static String? _overrideUrl;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _overrideUrl = prefs.getString('DEV_API_BASE_URL_OVERRIDE');
  }

  static Future<void> setOverrideUrl(String? url) async {
    final prefs = await SharedPreferences.getInstance();
    if (url != null) {
      await prefs.setString('DEV_API_BASE_URL_OVERRIDE', url);
    } else {
      await prefs.remove('DEV_API_BASE_URL_OVERRIDE');
    }
    _overrideUrl = url;
  }

  static String? get overrideUrl => _overrideUrl;

  static String get baseUrl {
    if (_overrideUrl != null && _overrideUrl!.isNotEmpty) {
      return _overrideUrl!;
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
  }
}