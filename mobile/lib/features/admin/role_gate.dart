import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/domain/auth_state.dart';
import '../auth/presentation/auth_provider.dart';

class AdminOnly extends ConsumerWidget {
  final Widget child;

  const AdminOnly({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    if (authState.role == AuthRole.admin) {
      return child;
    }
    return const SizedBox.shrink();
  }
}

bool isAdmin(WidgetRef ref) {
  return ref.read(authStateProvider).role == AuthRole.admin;
}
