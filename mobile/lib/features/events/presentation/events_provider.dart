import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/auth_provider.dart';
import '../data/events_api.dart';
import '../domain/event_model.dart';

final eventsApiProvider = Provider((ref) => EventsApi(ref.read(apiClientProvider)));

final eventsProvider = StateNotifierProvider<EventsNotifier, AsyncValue<List<EventModel>>>((ref) {
  return EventsNotifier(ref.read(eventsApiProvider));
});

class EventsNotifier extends StateNotifier<AsyncValue<List<EventModel>>> {
  final EventsApi _api;

  EventsNotifier(this._api) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final courses = await _api.getCourses();
      state = AsyncValue.data(courses);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> createCourse({
    required String name,
    required String code,
    required String description,
    required int duration,
    required String unit,
  }) async {
    await _api.createCourse(
      name: name,
      code: code,
      description: description,
      duration: duration,
      unit: unit,
    );
    await load();
  }

  Future<void> deleteCourse(String code) async {
    await _api.deleteCourse(code);
    await load();
  }

  Future<String> downloadSpreadsheet(String code, String savePath) async {
    return await _api.downloadSpreadsheet(code, savePath);
  }
}

final scanContextProvider = FutureProvider.family<ScanContext, String>((ref, code) async {
  final api = ref.read(eventsApiProvider);
  return await api.getScanContext(code);
});

final registrantsProvider = FutureProvider.family<List<Registrant>, String>((ref, code) async {
  final api = ref.read(eventsApiProvider);
  return await api.getRegistrants(code);
});
