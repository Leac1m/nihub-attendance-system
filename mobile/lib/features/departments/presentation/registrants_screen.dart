import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/services/notification_service.dart';
import '../domain/department_model.dart';
import 'departments_provider.dart';
import 'widgets/registrant_list_tile.dart';

class RegistrantsScreen extends ConsumerStatefulWidget {
  final String departmentCode;

  const RegistrantsScreen({super.key, required this.departmentCode});

  @override
  ConsumerState<RegistrantsScreen> createState() => _RegistrantsScreenState();
}

class _RegistrantsScreenState extends ConsumerState<RegistrantsScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    setState(() => _query = value.toLowerCase().trim());
  }

  @override
  Widget build(BuildContext context) {
    final registrantsAsync = ref.watch(registrantsProvider(widget.departmentCode));

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Padding(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.screenHorizontal),
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
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
                  style:
                      GoogleFonts.inter(fontSize: 15, color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    filled: false,
                    fillColor: Colors.transparent,
                    hintText: 'Search registrants...',
                    hintStyle: GoogleFonts.inter(
                        fontSize: 15, color: AppColors.textMuted),
                    prefixIcon: const Icon(Icons.search,
                        color: AppColors.textMuted, size: 20),
                    suffixIcon: _query.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear,
                                color: AppColors.textMuted, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _query = '');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Expanded(
              child: registrantsAsync.when(
                data: (registrants) {
                  final filtered = registrants.where((r) {
                    if (_query.isEmpty) return true;
                    return r.name.toLowerCase().contains(_query) ||
                        r.email.toLowerCase().contains(_query) ||
                        (r.matricNumber?.toLowerCase().contains(_query) ?? false);
                  }).toList();

                  if (registrants.isEmpty) {
                    return _EmptyState(
                      message: 'No registrants yet.\nUse the public registration form to add some.',
                    );
                  }
                  if (filtered.isEmpty) {
                    return _EmptyState(
                      message: 'No registrants match your search.',
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: () async {
                      ref.invalidate(registrantsProvider(widget.departmentCode));
                      await Future<void>.delayed(
                          const Duration(milliseconds: 200));
                    },
                    color: AppColors.primary,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.screenHorizontal),
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) =>
                          const SizedBox(height: AppSpacing.sm),
                      itemBuilder: (context, i) {
                        final r = filtered[i];
                        return RegistrantListTile(
                          registrant: r,
                          onAction: (action) =>
                              _handleAction(context, r, action),
                        );
                      },
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
                      Icon(Icons.error_outline,
                          color: AppColors.error, size: 48),
                      const SizedBox(height: AppSpacing.lg),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          'Failed to load registrants.\n$e',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                              color: AppColors.error, fontSize: 14),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      ElevatedButton(
                        onPressed: () => ref.invalidate(
                            registrantsProvider(widget.departmentCode)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: Text('Retry',
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.screenHorizontal,
        vertical: AppSpacing.lg,
      ),
      decoration: const BoxDecoration(color: AppColors.surface),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back,
                color: AppColors.primaryDeep, size: 24),
            onPressed: () => context.pop(),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Registrants',
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryDeep,
                  ),
                ),
                Text(
                  widget.departmentCode,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textMuted,
                    letterSpacing: 1.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleAction(
    BuildContext context,
    Registrant r,
    RegistrantAction action,
  ) async {
    final api = ref.read(departmentsApiProvider);
    final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

    try {
      switch (action) {
        case RegistrantAction.checkIn:
          await api.markAttendanceById(
              widget.departmentCode, r.id, true, date: today);
          NotificationService.showSuccess(
              '${r.name} marked present for today');
          break;
        case RegistrantAction.checkOut:
          await api.markAttendanceById(
              widget.departmentCode, r.id, false, date: today);
          NotificationService.showSuccess(
              '${r.name} marked absent for today');
          break;
        case RegistrantAction.viewDetails:
          if (context.mounted) {
            context.push(
              '/departments/${widget.departmentCode}/scan-success?qrValue=${r.id}',
            );
          }
          return;
      }
      ref.invalidate(registrantsProvider(widget.departmentCode));
    } catch (e) {
      NotificationService.showError(e);
    }
  }
}

class _EmptyState extends StatelessWidget {
  final String message;
  const _EmptyState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline,
                size: 64, color: AppColors.textMuted.withValues(alpha: 0.5)),
            const SizedBox(height: AppSpacing.lg),
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 15,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}