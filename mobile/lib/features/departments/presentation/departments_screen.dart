import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../auth/presentation/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/error_handler.dart';
import '../../../core/services/notification_service.dart';
import 'departments_provider.dart';
import 'widgets/department_card.dart';

class DepartmentsScreen extends ConsumerStatefulWidget {
  const DepartmentsScreen({super.key});

  @override
  ConsumerState<DepartmentsScreen> createState() => _DepartmentsScreenState();
}

class _DepartmentsScreenState extends ConsumerState<DepartmentsScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      setState(() => _query = value.toLowerCase());
    });
  }

  @override
  Widget build(BuildContext context) {
    final departmentsAsync = ref.watch(departmentsProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            Material(
              elevation: 3,
              shadowColor: Colors.black.withValues(alpha: 0.1),
              color: AppColors.surface,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.screenHorizontal,
                  vertical: AppSpacing.lg,
                ),
                decoration: const BoxDecoration(color: AppColors.surface),
                child: Row(
                  children: [
                    const SizedBox(width: 48),
                    const Spacer(),
                    Text(
                      'NIHUB',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryDeep,
                        letterSpacing: 1,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.logout,
                          color: AppColors.textSecondary, size: 26),
                      onPressed: () async {
                        await ref.read(authStateProvider.notifier).signOut();
                        if (mounted) context.go('/signin');
                      },
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: departmentsAsync.when(
                data: (departments) {
                  final filtered = departments
                      .where((d) =>
                          d.name.toLowerCase().contains(_query) ||
                          d.code.toLowerCase().contains(_query) ||
                          d.duration.toLowerCase().contains(_query))
                      .toList();

                  return RefreshIndicator(
                    onRefresh: () =>
                        ref.read(departmentsProvider.notifier).load(),
                    color: AppColors.primary,
                    child: ListView(
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.screenHorizontal),
                      children: [
                        const SizedBox(height: AppSpacing.md),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Departments',
                            style: GoogleFonts.inter(
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        Container(
                          height: 54,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.borderLight),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.03),
                                offset: const Offset(0, 4),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: _onSearchChanged,
                            style: GoogleFonts.inter(
                                fontSize: 16, color: AppColors.textPrimary),
                            decoration: InputDecoration(
                              filled: false,
                              fillColor: Colors.transparent,
                              hintText: 'Search departments...',
                              hintStyle: GoogleFonts.inter(
                                  fontSize: 16, color: AppColors.textMuted),
                              prefixIcon: const Icon(Icons.search,
                                  color: AppColors.textMuted, size: 22),
                              suffixIcon: _query.isNotEmpty
                                  ? IconButton(
                                      icon: const Icon(Icons.clear,
                                          color: AppColors.textMuted,
                                          size: 20),
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() => _query = '');
                                      },
                                    )
                                  : null,
                              border: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              contentPadding:
                                  const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        if (filtered.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.event_busy,
                                  size: 64,
                                  color:
                                      AppColors.textMuted.withValues(alpha: 0.5),
                                ),
                                const SizedBox(height: AppSpacing.lg),
                                Text(
                                  _query.isNotEmpty
                                      ? 'No departments match your search'
                                      : 'No departments found',
                                  style: GoogleFonts.inter(
                                    fontSize: 16,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          ...filtered.asMap().entries.map((entry) {
                            final i = entry.key;
                            final department = entry.value;
                            return Padding(
                              padding:
                                  const EdgeInsets.only(bottom: AppSpacing.lg),
                              child: DepartmentCard(
                                department: department,
                                index: i,
                                onTap: () => context.push(
                                    '/departments/${department.code}/scan'),
                                onDelete: () => ref
                                    .read(departmentsProvider.notifier)
                                    .deleteDepartment(department.code),
                                onDownload: () =>
                                    _downloadSpreadsheet(department.code),
                                onViewRegistrants: () => context.push(
                                    '/departments/${department.code}/registrants'),
                              ),
                            );
                          }),
                        const SizedBox(height: 80),
                      ],
                    ),
                  );
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
                error: (e, _) => Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Error: ${ErrorHandler.getMessage(e)}',
                        style: GoogleFonts.inter(
                            color: AppColors.error, fontSize: 14),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      ElevatedButton(
                        onPressed: () =>
                            ref.read(departmentsProvider.notifier).load(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: Text('Retry',
                            style:
                                GoogleFonts.inter(fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/departments/create'),
        icon: const Icon(Icons.add),
        label: Text(
          'Create Department',
          style: GoogleFonts.inter(fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
    );
  }

  Future<void> _downloadSpreadsheet(String code) async {
    try {
      final directory = await getTemporaryDirectory();
      final savePath = '${directory.path}/attendance_$code.xlsx';
      await ref
          .read(departmentsProvider.notifier)
          .downloadSpreadsheet(code, savePath);
      await Share.shareXFiles([XFile(savePath)], text: 'Attendance for $code');
    } catch (e) {
      NotificationService.showError(e);
    }
  }
}