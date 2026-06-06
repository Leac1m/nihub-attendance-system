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
}