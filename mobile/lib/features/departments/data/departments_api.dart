import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../../../core/config/api_config.dart';
import '../../../core/config/endpoints.dart';
import '../../../core/network/api_client.dart';
import '../domain/department_model.dart';

class DepartmentsApi {
  final ApiClient _client;

  DepartmentsApi(this._client);

  Future<List<DepartmentModel>> getDepartments() async {
    final res = await _client.get(Endpoints.departments);
    final dynamic data = res.data;
    List<dynamic> list;
    if (data is List) {
      list = data;
    } else if (data is Map) {
      list = data['departments'] ?? data['courses'] ?? [];
    } else {
      list = [];
    }
    return list.map((e) => DepartmentModel.fromJson(e)).toList();
  }

  Future<DepartmentModel> createDepartment({
    required String name,
    required String code,
    required int duration,
    required String unit,
  }) async {
    final res = await _client.post(
      Endpoints.departments,
      data: {
        'name': name,
        'code': code,
        'duration': '$duration $unit',
      },
      requiresAuth: true,
    );
    final raw = res.data;
    final data = raw is Map ? raw['department'] ?? raw['course'] ?? raw : raw;
    return DepartmentModel.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<void> deleteDepartment(String code) async {
    await _client.delete(Endpoints.department(code), requiresAuth: true);
  }

  Future<List<Registrant>> getRegistrants(String code) async {
    final res = await _client.get(
      Endpoints.departmentRegistrants(code),
      requiresAuth: true,
    );
    final dynamic data = res.data;
    List<dynamic> registrantList;
    if (data is List) {
      registrantList = data;
    } else if (data is Map) {
      registrantList = data['registrants'] ?? [];
    } else {
      registrantList = [];
    }
    return registrantList.map((e) {
      final map = Map<String, dynamic>.from(e);
      if (map['image_url'] != null &&
          !map['image_url'].toString().startsWith('http')) {
        map['image_url'] = '${ApiConfig.baseUrl}${map['image_url']}';
      }
      return Registrant.fromJson(map);
    }).toList();
  }

  Future<void> registerForDepartment(String code, Map<String, dynamic> data) async {
    await _client.post(Endpoints.departmentRegister(code), data: data);
  }

  Future<void> markAttendanceById(
    String code,
    String registrantId,
    bool present, {
    required String date,
  }) async {
    await _client.post(
      Endpoints.departmentAttendanceById(code),
      data: {'id': registrantId, 'present': present, 'date': date},
      requiresAuth: true,
    );
  }

  Future<void> checkIn(
    String code,
    String registrantId, {
    DateTime? occurredAt,
  }) async {
    final body = <String, dynamic>{'id': registrantId};
    if (occurredAt != null) {
      body['occurred_at'] = occurredAt.toIso8601String();
    }
    await _client.post(
      '/departments/$code/check-in',
      data: body,
      requiresAuth: true,
    );
  }

  Future<void> checkOut(
    String code,
    String registrantId, {
    DateTime? occurredAt,
  }) async {
    final body = <String, dynamic>{'id': registrantId};
    if (occurredAt != null) {
      body['occurred_at'] = occurredAt.toIso8601String();
    }
    await _client.post(
      '/departments/$code/check-out',
      data: body,
      requiresAuth: true,
    );
  }

  Future<List<Map<String, dynamic>>> getSessionsForDate(
    String code,
    DateTime date,
  ) async {
    final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    final res = await _client.get(
      '/departments/$code/attendance/sessions?date=$dateStr',
      requiresAuth: true,
    );
    final dynamic data = res.data;
    if (data is Map && data['sessions'] != null) {
      return List<Map<String, dynamic>>.from(
        (data['sessions'] as List).map((e) => Map<String, dynamic>.from(e)),
      );
    }
    return [];
  }

  Future<Registrant> getRegistrant(String code, String id) async {
    final res = await _client.get(
      Endpoints.departmentRegistrant(code, id),
      requiresAuth: true,
    );
    final raw = res.data;
    final data = raw is Map ? raw['registrant'] ?? raw : raw;
    final map = Map<String, dynamic>.from(data as Map);
    if (map['image_url'] != null &&
        !map['image_url'].toString().startsWith('http')) {
      map['image_url'] = '${ApiConfig.baseUrl}${map['image_url']}';
    }
    return Registrant.fromJson(map);
  }

  Future<String> downloadSpreadsheet(String code, String savePath) async {
    await _client.download(
      Endpoints.departmentAttendanceSpreadsheet(code),
      savePath,
      requiresAuth: true,
    );
    return savePath;
  }

  Future<DepartmentModel> updateDepartment(String code, {String? name, String? duration}) async {
    final String endpoint = Endpoints.departmentUpdate;
    final String uri = endpoint.replaceAll('{code}', code);
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (duration != null) body['duration'] = duration;
    final resp = await _client.put(uri, data: body, requiresAuth: true);
    return DepartmentModel.fromJson(resp.data);
  }

  Future<Registrant> updateRegistrant(String code, String id, {String? name, String? email, String? phone}) async {
    final String endpoint = Endpoints.registrantUpdateAdmin;
    final String uri = endpoint.replaceAll('{code}', code).replaceAll('{id}', id);
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (email != null) body['email'] = email;
    if (phone != null) body['phone'] = phone;
    final resp = await _client.put(uri, data: body, requiresAuth: true);
    return Registrant.fromJson(resp.data['registrant']);
  }

  Future<void> deleteRegistrant(String code, String id) async {
    final String endpoint = Endpoints.registrantDeleteAdmin;
    final String uri = endpoint.replaceAll('{code}', code).replaceAll('{id}', id);
    await _client.delete(uri, requiresAuth: true);
  }

  Future<Registrant> createRegistrantWithPhoto(
    String code, {
    required String name,
    required String email,
    String? phone,
    required String matriculationNumber,
    String? imageFilePath,
  }) async {
    final uri = '/admin/departments/$code/registrants';
    final formData = FormData.fromMap({
      'name': name,
      'email': email,
      'phone': phone ?? '',
      'matriculation_number': matriculationNumber,
      if (imageFilePath != null)
        'image': await MultipartFile.fromFile(imageFilePath, filename: 'photo.jpg'),
    });
    final resp = await _client.post(uri, data: formData, requiresAuth: true);
    return Registrant.fromJson(resp.data['registrant']);
  }

  Future<void> setManualAttendance(String code, String id, DateTime date, int status) async {
    final String endpoint = Endpoints.registrantManualAttendance;
    final String uri = endpoint.replaceAll('{code}', code).replaceAll('{id}', id);
    final dateStr = '${date.year}-${date.month.toString().padLeft(2,'0')}-${date.day.toString().padLeft(2,'0')}';
    await _client.put(uri, data: {'date': dateStr, 'status': status}, requiresAuth: true);
  }

  Future<bool> resendQr(String code, String id) async {
    final String endpoint = Endpoints.registrantResendQr;
    final String uri = endpoint.replaceAll('{code}', code).replaceAll('{id}', id);
    final resp = await _client.post(uri, requiresAuth: true);
    return resp.data['sent'] == true;
  }

  Future<Uint8List> downloadQrPng(String code, String id) async {
    final String endpoint = Endpoints.registrantQrPng;
    final String uri = endpoint.replaceAll('{code}', code).replaceAll('{id}', id);
    final resp = await _client.getBytes(uri, requiresAuth: true);
    final List<int>? data = resp.data;
    return Uint8List.fromList(data ?? []);
  }

  Future<StaffProfile> whoami() async {
    final resp = await _client.get(Endpoints.adminWhoami, requiresAuth: true);
    return StaffProfile.fromJson(resp.data);
  }

  Future<StaffProfile> approveStaffAdmin(String username) async {
    final String endpoint = Endpoints.adminStaffApprove;
    final String uri = endpoint.replaceAll('{username}', username);
    final resp = await _client.post(uri, requiresAuth: true);
    return StaffProfile.fromJson(resp.data);
  }

  Future<List<StaffProfile>> listPendingAdminRequests() async {
    final resp = await _client.get(Endpoints.adminStaffPending, requiresAuth: true);
    return (resp.data as List).map((e) => StaffProfile.fromJson(e)).toList();
  }
}
