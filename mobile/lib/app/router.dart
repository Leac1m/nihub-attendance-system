import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bot_toast/bot_toast.dart';
import '../core/network/auth_event_bus.dart';
import '../features/auth/presentation/auth_provider.dart';
import '../features/auth/presentation/signin_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/auth/presentation/verify_account_screen.dart';
import '../features/auth/domain/auth_state.dart';
import '../features/departments/presentation/departments_screen.dart';
import '../features/departments/presentation/create_department_screen.dart';
import '../features/departments/presentation/registrants_screen.dart';
import '../features/departments/presentation/scan_screen.dart';
import '../features/departments/presentation/scan_result_screen.dart';
import '../features/departments/presentation/edit_department_screen.dart';
import '../features/departments/presentation/create_registrant_screen.dart';
import '../features/departments/presentation/edit_registrant_screen.dart';
import '../features/departments/presentation/widgets/attendance_calendar.dart';
import '../features/departments/presentation/admin_profile_screen.dart';
import '../features/departments/presentation/pending_admin_requests_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ValueNotifier<bool>(ref.read(authStateProvider).isAuthenticated);

  ref.listen(authStateProvider.select((s) => s.isAuthenticated), (_, next) {
    notifier.value = next;
  });

  final forceSignOutNotifier = ValueNotifier<int>(0);
  final busSub = AuthEventBus().stream.listen((event) {
    if (event == AuthEvent.forceSignOut) {
      forceSignOutNotifier.value++;
    }
  });
  ref.onDispose(busSub.cancel);

  final refresh = _CompositeListenable([notifier, forceSignOutNotifier]);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    observers: [BotToastNavigatorObserver()],
    redirect: (context, state) {
      final isAuthenticated = ref.read(authStateProvider).isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/signin' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/verify-account' ||
          state.matchedLocation == '/';

      if (isAuthRoute) {
        if (isAuthenticated) return '/departments';
        return null;
      }

      if (!isAuthenticated) return '/signin';

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) {
          if (ref.read(authStateProvider).isAuthenticated) {
            return const DepartmentsScreen();
          }
          return const SignInScreen();
        },
      ),
      GoRoute(path: '/signin', builder: (_, _) => const SignInScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(
        path: '/verify-account',
        builder: (_, state) {
          final username = state.extra as String? ?? '';
          return VerifyAccountScreen(username: username);
        },
      ),
      GoRoute(
        path: '/departments',
        builder: (_, _) => const DepartmentsScreen(),
      ),
      GoRoute(
        path: '/departments/create',
        builder: (_, _) => const CreateDepartmentScreen(),
      ),
      GoRoute(
        path: '/departments/:departmentCode/scan',
        builder: (_, state) {
          final code = state.pathParameters['departmentCode']!;
          return ScanScreen(departmentCode: code);
        },
      ),
      GoRoute(
        path: '/departments/:departmentCode/scan-success',
        builder: (_, state) {
          final code = state.pathParameters['departmentCode']!;
          final qrValue = state.uri.queryParameters['qrValue'] ?? '';
          return ScanResultScreen(departmentCode: code, qrValue: qrValue);
        },
      ),
      GoRoute(
        path: '/departments/:departmentCode/registrants',
        builder: (_, state) {
          final code = state.pathParameters['departmentCode']!;
          return RegistrantsScreen(departmentCode: code);
        },
      ),
      GoRoute(
        path: '/departments/:departmentCode/edit',
        builder: (context, state) => Consumer(
          builder: (context, ref, _) {
            if (ref.read(authStateProvider).role != AuthRole.admin) {
              return const DepartmentsScreen();
            }
            return EditDepartmentScreen(
              departmentCode: state.pathParameters['departmentCode']!,
            );
          },
        ),
      ),
      GoRoute(
        path: '/departments/:departmentCode/registrants/new',
        builder: (context, state) => Consumer(
          builder: (context, ref, _) {
            if (ref.read(authStateProvider).role != AuthRole.admin) {
              return const DepartmentsScreen();
            }
            return CreateRegistrantScreen(
              departmentCode: state.pathParameters['departmentCode']!,
            );
          },
        ),
      ),
      GoRoute(
        path: '/departments/:departmentCode/registrants/:registrantId/edit',
        builder: (context, state) => Consumer(
          builder: (context, ref, _) {
            if (ref.read(authStateProvider).role != AuthRole.admin) {
              return const DepartmentsScreen();
            }
            return EditRegistrantScreen(
              departmentCode: state.pathParameters['departmentCode']!,
              registrantId: state.pathParameters['registrantId']!,
            );
          },
        ),
      ),
      GoRoute(
        path: '/departments/:departmentCode/registrants/:registrantId/attendance',
        builder: (context, state) => Consumer(
          builder: (context, ref, _) {
            if (ref.read(authStateProvider).role != AuthRole.admin) {
              return const DepartmentsScreen();
            }
            return AttendanceCalendarScreen(
              departmentCode: state.pathParameters['departmentCode']!,
              registrantId: state.pathParameters['registrantId']!,
            );
          },
        ),
      ),
      GoRoute(
        path: '/admin/profile',
        builder: (context, state) => const AdminProfileScreen(),
      ),
      GoRoute(
        path: '/admin/pending-requests',
        builder: (context, state) => Consumer(
          builder: (context, ref, _) {
            if (ref.read(authStateProvider).role != AuthRole.admin) {
              return const DepartmentsScreen();
            }
            return const PendingAdminRequestsScreen();
          },
        ),
      ),
    ],
  );
});

class _CompositeListenable extends Listenable {
  final List<Listenable> _listenables;
  final List<VoidCallback> _callbacks = [];

  _CompositeListenable(this._listenables) {
    for (final l in _listenables) {
      l.addListener(_notify);
    }
  }

  void _notify() {
    for (final cb in List<VoidCallback>.from(_callbacks)) {
      cb();
    }
  }

  @override
  void addListener(VoidCallback listener) {
    _callbacks.add(listener);
  }

  @override
  void removeListener(VoidCallback listener) {
    _callbacks.remove(listener);
  }
}
