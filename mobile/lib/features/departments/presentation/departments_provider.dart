import 'dart:typed_data';

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

final updateRegistrantProvider = StateNotifierProvider<UpdateRegistrantNotifier, AsyncValue<void>>((ref) {
  return UpdateRegistrantNotifier(ref.read(departmentsApiProvider));
});

class UpdateRegistrantNotifier extends StateNotifier<AsyncValue<void>> {
  final DepartmentsApi _api;
  UpdateRegistrantNotifier(this._api) : super(const AsyncValue.data(null));

  Future<void> update(String code, String id, {String? name, String? email, String? phone}) async {
    state = const AsyncValue.loading();
    try {
      await _api.updateRegistrant(code, id, name: name, email: email, phone: phone);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final deleteRegistrantProvider = StateNotifierProvider<DeleteRegistrantNotifier, AsyncValue<void>>((ref) {
  return DeleteRegistrantNotifier(ref.read(departmentsApiProvider), ref);
});

class DeleteRegistrantNotifier extends StateNotifier<AsyncValue<void>> {
  final DepartmentsApi _api;
  final Ref _ref;
  DeleteRegistrantNotifier(this._api, this._ref) : super(const AsyncValue.data(null));

  Future<void> delete(String code, String id) async {
    state = const AsyncValue.loading();
    try {
      await _api.deleteRegistrant(code, id);
      _ref.invalidate(registrantsProvider(code));
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final createRegistrantProvider = StateNotifierProvider<CreateRegistrantNotifier, AsyncValue<void>>((ref) {
  return CreateRegistrantNotifier(ref.read(departmentsApiProvider), ref);
});

class CreateRegistrantNotifier extends StateNotifier<AsyncValue<void>> {
  final DepartmentsApi _api;
  final Ref _ref;
  CreateRegistrantNotifier(this._api, this._ref) : super(const AsyncValue.data(null));

  Future<void> create(
    String code, {
    required String name,
    required String email,
    String? phone,
    required String matriculationNumber,
    String? imageFilePath,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _api.createRegistrantWithPhoto(code,
        name: name,
        email: email,
        phone: phone,
        matriculationNumber: matriculationNumber,
        imageFilePath: imageFilePath,
      );
      _ref.invalidate(registrantsProvider(code));
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final manualAttendanceProvider = StateNotifierProvider<ManualAttendanceNotifier, AsyncValue<void>>((ref) {
  return ManualAttendanceNotifier(ref.read(departmentsApiProvider));
});

class ManualAttendanceNotifier extends StateNotifier<AsyncValue<void>> {
  final DepartmentsApi _api;
  ManualAttendanceNotifier(this._api) : super(const AsyncValue.data(null));

  Future<void> set(String code, String id, DateTime date, int status) async {
    state = const AsyncValue.loading();
    try {
      await _api.setManualAttendance(code, id, date, status);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final resendQrProvider = StateNotifierProvider<ResendQrNotifier, AsyncValue<bool>>((ref) {
  return ResendQrNotifier(ref.read(departmentsApiProvider));
});

class ResendQrNotifier extends StateNotifier<AsyncValue<bool>> {
  final DepartmentsApi _api;
  ResendQrNotifier(this._api) : super(const AsyncValue.data(false));

  Future<bool> resend(String code, String id) async {
    state = const AsyncValue.loading();
    try {
      final sent = await _api.resendQr(code, id);
      state = AsyncValue.data(sent);
      return sent;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }
}

final downloadQrProvider = StateNotifierProvider<DownloadQrNotifier, AsyncValue<Uint8List>>((ref) {
  return DownloadQrNotifier(ref.read(departmentsApiProvider));
});

class DownloadQrNotifier extends StateNotifier<AsyncValue<Uint8List>> {
  final DepartmentsApi _api;
  DownloadQrNotifier(this._api) : super(AsyncValue.data(Uint8List(0)));

  Future<Uint8List> download(String code, String id) async {
    state = const AsyncValue.loading();
    try {
      final bytes = await _api.downloadQrPng(code, id);
      state = AsyncValue.data(bytes);
      return bytes;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }
}

final whoamiProvider = FutureProvider<StaffProfile>((ref) async {
  return ref.read(departmentsApiProvider).whoami();
});

final pendingAdminRequestsProvider = FutureProvider<List<StaffProfile>>((ref) async {
  return ref.read(departmentsApiProvider).listPendingAdminRequests();
});

final approveStaffAdminProvider = StateNotifierProvider<ApproveStaffAdminNotifier, AsyncValue<void>>((ref) {
  return ApproveStaffAdminNotifier(ref.read(departmentsApiProvider), ref);
});

class ApproveStaffAdminNotifier extends StateNotifier<AsyncValue<void>> {
  final DepartmentsApi _api;
  final Ref _ref;
  ApproveStaffAdminNotifier(this._api, this._ref) : super(const AsyncValue.data(null));

  Future<void> approve(String username) async {
    state = const AsyncValue.loading();
    try {
      await _api.approveStaffAdmin(username);
      _ref.invalidate(pendingAdminRequestsProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

final updateDepartmentProvider = StateNotifierProvider<UpdateDepartmentNotifier, AsyncValue<void>>((ref) {
  return UpdateDepartmentNotifier(ref.read(departmentsApiProvider), ref);
});

class UpdateDepartmentNotifier extends StateNotifier<AsyncValue<void>> {
  final DepartmentsApi _api;
  final Ref _ref;
  UpdateDepartmentNotifier(this._api, this._ref) : super(const AsyncValue.data(null));

  Future<void> update(String code, {String? name, String? duration}) async {
    state = const AsyncValue.loading();
    try {
      await _api.updateDepartment(code, name: name, duration: duration);
      _ref.invalidate(departmentsProvider);
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}
