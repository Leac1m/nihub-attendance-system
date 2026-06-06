import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/presentation/auth_provider.dart';
import '../data/departments_api.dart';
import '../domain/department_model.dart';

final departmentsApiProvider =
    Provider((ref) => DepartmentsApi(ref.read(apiClientProvider)));

final departmentsProvider =
    StateNotifierProvider<DepartmentsNotifier, AsyncValue<List<DepartmentModel>>>(
        (ref) {
  return DepartmentsNotifier(ref.read(departmentsApiProvider));
});

class DepartmentsNotifier
    extends StateNotifier<AsyncValue<List<DepartmentModel>>> {
  final DepartmentsApi _api;

  DepartmentsNotifier(this._api) : super(const AsyncValue.loading()) {
    load();
  }

  Future<void> load() async {
    state = const AsyncValue.loading();
    try {
      final departments = await _api.getDepartments();
      state = AsyncValue.data(departments);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> createDepartment({
    required String name,
    required String code,
    required int duration,
    required String unit,
  }) async {
    await _api.createDepartment(
      name: name,
      code: code,
      duration: duration,
      unit: unit,
    );
    await load();
  }

  Future<void> deleteDepartment(String code) async {
    await _api.deleteDepartment(code);
    await load();
  }

  Future<String> downloadSpreadsheet(String code, String savePath) async {
    return await _api.downloadSpreadsheet(code, savePath);
  }
}

final registrantDetailsProvider = FutureProvider.family<Registrant,
    ({String departmentCode, String registrantId})>((ref, arg) async {
  final api = ref.read(departmentsApiProvider);
  return await api.getRegistrant(arg.departmentCode, arg.registrantId);
});

final registrantsProvider =
    FutureProvider.family<List<Registrant>, String>((ref, code) async {
  final api = ref.read(departmentsApiProvider);
  return await api.getRegistrants(code);
});