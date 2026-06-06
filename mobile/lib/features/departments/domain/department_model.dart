class DepartmentModel {
  final String id;
  final String name;
  final String code;
  final String duration;
  final DateTime? createdAt;

  DepartmentModel({
    required this.id,
    required this.name,
    required this.code,
    required this.duration,
    this.createdAt,
  });

  factory DepartmentModel.fromJson(Map<String, dynamic> json) {
    return DepartmentModel(
      id: json['code'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      duration: json['duration'] ?? '',
      createdAt: null,
    );
  }
}

class Registrant {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? matricNumber;
  final String? photoUrl;
  final List<AttendanceDay>? attendanceDays;

  Registrant({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.matricNumber,
    this.photoUrl,
    this.attendanceDays,
  });

  factory Registrant.fromJson(Map<String, dynamic> json) {
    final rawDays = json['attendance_days'];
    final days = rawDays is List
        ? rawDays
            .whereType<Map>()
            .map((m) => AttendanceDay.fromJson(Map<String, dynamic>.from(m)))
            .toList()
        : <AttendanceDay>[];
    return Registrant(
      id: (json['id'] ?? '').toString(),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      matricNumber: json['matriculation_number'],
      photoUrl: json['image_url'] ?? json['photo_url'],
      attendanceDays: days,
    );
  }
}

class AttendanceDay {
  final String date;
  final bool present;

  const AttendanceDay({required this.date, required this.present});

  factory AttendanceDay.fromJson(Map<String, dynamic> json) {
    return AttendanceDay(
      date: (json['date'] ?? '').toString(),
      present: json['present'] == true,
    );
  }
}