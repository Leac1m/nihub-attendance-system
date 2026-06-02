class EventModel {
  final String id;
  final String name;
  final String code;
  final String description;
  final String duration;
  final DateTime? createdAt;

  EventModel({
    required this.id,
    required this.name,
    required this.code,
    required this.description,
    required this.duration,
    this.createdAt,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['code'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      description: json['description'] ?? '',
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

  Registrant({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.matricNumber,
    this.photoUrl,
  });

  factory Registrant.fromJson(Map<String, dynamic> json) {
    return Registrant(
      id: (json['id'] ?? '').toString(),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      matricNumber: json['matriculation_number'],
      photoUrl: json['image_url'] ?? json['photo_url'],
    );
  }
}

class ScanContext {
  final EventModel course;
  final Registrant attendee;

  ScanContext({required this.course, required this.attendee});

  factory ScanContext.fromJson(Map<String, dynamic> json) {
    return ScanContext(
      course: EventModel.fromJson(json['course'] ?? {}),
      attendee: Registrant.fromJson(json['attendee'] ?? {}),
    );
  }
}
