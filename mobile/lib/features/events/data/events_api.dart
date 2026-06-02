import '../../../core/config/api_config.dart';
import '../../../core/config/endpoints.dart';
import '../../../core/network/api_client.dart';
import '../domain/event_model.dart';

class EventsApi {
  final ApiClient _client;

  EventsApi(this._client);

  Future<List<EventModel>> getCourses() async {
    final res = await _client.get(Endpoints.courses);
    // Backend returns { "courses": [...] } - extract the list
    final dynamic data = res.data;
    List<dynamic> courseList;
    if (data is List) {
      courseList = data;
    } else if (data is Map) {
      courseList = data['courses'] ?? [];
    } else {
      courseList = [];
    }
    return courseList.map((e) => EventModel.fromJson(e)).toList();
  }

  Future<EventModel> createCourse({
    required String name,
    required String code,
    required String description,
    required int duration,
    required String unit,
  }) async {
    final res = await _client.post(
      Endpoints.courses,
      data: {
        'name': name,
        'code': code,
        'description': description,
        'duration': '$duration $unit',
      },
      requiresAuth: true,
    );
    return EventModel.fromJson(res.data['course'] ?? res.data);
  }

  Future<void> deleteCourse(String code) async {
    await _client.delete(Endpoints.course(code), requiresAuth: true);
  }

  Future<List<Registrant>> getRegistrants(String code) async {
    final res = await _client.get(
      Endpoints.courseRegistrants(code),
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
      // Prefix relative image URLs with base URL so Image.network() works
      if (map['image_url'] != null && !map['image_url'].toString().startsWith('http')) {
        map['image_url'] = '${ApiConfig.baseUrl}${map['image_url']}';
      }
      return Registrant.fromJson(map);
    }).toList();
  }

  Future<void> registerForCourse(String code, Map<String, dynamic> data) async {
    await _client.post(Endpoints.courseRegister(code), data: data);
  }

  Future<ScanContext> getScanContext(String code) async {
    final res = await _client.get(Endpoints.scanContext(code));
    final map = Map<String, dynamic>.from(res.data);
    // Prefix relative image URLs with base URL
    if (map['attendee'] != null && map['attendee']['image_url'] != null) {
      final img = map['attendee']['image_url'].toString();
      if (!img.startsWith('http')) {
        map['attendee']['image_url'] = '${ApiConfig.baseUrl}$img';
      }
    }
    return ScanContext.fromJson(map);
  }

  Future<void> markAttendanceById(String code, String registrantId, bool present, {required String date}) async {
    await _client.post(
      Endpoints.courseAttendanceById(code),
      data: {'id': registrantId, 'present': present, 'date': date},
      requiresAuth: true,
    );
  }

  Future<Registrant> getRegistrant(String code, String id) async {
    final res = await _client.get(
      Endpoints.courseRegistrant(code, id),
      requiresAuth: true,
    );
    final data = Map<String, dynamic>.from(res.data['registrant'] ?? res.data);
    // Prefix relative image URLs with base URL
    if (data['image_url'] != null && !data['image_url'].toString().startsWith('http')) {
      data['image_url'] = '${ApiConfig.baseUrl}${data['image_url']}';
    }
    return Registrant.fromJson(data);
  }

  Future<String> downloadSpreadsheet(String code, String savePath) async {
    await _client.download(
      Endpoints.courseAttendanceSpreadsheet(code),
      savePath,
      requiresAuth: true,
    );
    return savePath;
  }
}
