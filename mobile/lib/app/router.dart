import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:bot_toast/bot_toast.dart';
import '../features/auth/presentation/auth_provider.dart';
import '../features/auth/presentation/signin_screen.dart';
import '../features/auth/presentation/register_screen.dart';
import '../features/auth/presentation/verify_account_screen.dart';
import '../features/events/presentation/events_screen.dart';
import '../features/events/presentation/create_event_screen.dart';
import '../features/events/presentation/scan_screen.dart';
import '../features/events/presentation/scan_result_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = ValueNotifier<bool>(ref.read(authStateProvider).isAuthenticated);

  ref.listen(authStateProvider.select((s) => s.isAuthenticated), (_, next) {
    notifier.value = next;
  });

  return GoRouter(
    initialLocation: '/',
    refreshListenable: notifier,
    observers: [BotToastNavigatorObserver()],
    redirect: (context, state) {
      final isAuthenticated = ref.read(authStateProvider).isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/signin' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/verify-account' ||
          state.matchedLocation == '/';

      if (isAuthRoute) {
        if (isAuthenticated) return '/events';
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
            return const EventsScreen();
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
      GoRoute(path: '/events', builder: (_, _) => const EventsScreen()),
      GoRoute(path: '/events/create', builder: (_, _) => const CreateEventScreen()),
      GoRoute(
        path: '/events/:eventCode/scan',
        builder: (_, state) {
          final code = state.pathParameters['eventCode']!;
          return ScanScreen(eventCode: code);
        },
      ),
      GoRoute(
        path: '/events/:eventCode/scan-success',
        builder: (_, state) {
          final code = state.pathParameters['eventCode']!;
          final qrValue = state.uri.queryParameters['qrValue'] ?? '';
          return ScanResultScreen(eventCode: code, qrValue: qrValue);
        },
      ),
    ],
  );
});
