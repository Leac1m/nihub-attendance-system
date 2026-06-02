import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/error_handler.dart';
import '../../../core/services/notification_service.dart';
import 'events_provider.dart';
import 'widgets/attendee_card.dart';

class ScanResultScreen extends ConsumerWidget {
  final String eventCode;
  final String qrValue;

  const ScanResultScreen({super.key, required this.eventCode, required this.qrValue});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scanContextAsync = ref.watch(scanContextProvider(eventCode));

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: scanContextAsync.when(
          data: (ctx) => SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenHorizontal,
                vertical: AppSpacing.lg,
              ),
              child: Column(
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back),
                      onPressed: () => context.pop(),
                      padding: EdgeInsets.zero,
                      alignment: Alignment.centerLeft,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  // Header with icon
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  child: const Icon(
                    Icons.qr_code_scanner,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Scan Successful',
                  style: GoogleFonts.inter(
                    fontSize: 30,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'Review attendee details below.',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: AppSpacing.xxl),
                // Attendee card
                AttendeeCard(
                  attendee: ctx.attendee,
                ),
                const SizedBox(height: AppSpacing.xxl),
                // Action buttons
                Row(
                  children: [
                    // Deny button
                    Expanded(
                      child: Container(
                        height: AppSpacing.buttonHeight,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: AppColors.error, width: 2),
                        ),
                        child: OutlinedButton.icon(
                          onPressed: () => _markAttendance(context, ref, qrValue, false),
                          icon: const Icon(Icons.close, color: AppColors.error, size: 20),
                          label: Text(
                            'Deny',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppColors.error,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.error,
                            side: BorderSide.none,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    // Accept button
                    Expanded(
                      child: Container(
                        height: AppSpacing.buttonHeight,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: AppShadows.buttonShadow(AppColors.primaryDeep),
                        ),
                        child: ElevatedButton.icon(
                          onPressed: () => _markAttendance(context, ref, qrValue, true),
                          icon: const Icon(Icons.check, color: Colors.white, size: 20),
                          label: Text(
                            'Accept',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryDeep,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            elevation: 0,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          ),
          error: (e, _) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, color: AppColors.error, size: 48),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  'Error: ${ErrorHandler.getMessage(e)}',
                  style: GoogleFonts.inter(color: AppColors.error, fontSize: 14),
                ),
                const SizedBox(height: AppSpacing.lg),
                ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: Text('Go Back', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _markAttendance(BuildContext context, WidgetRef ref, String matric, bool present) async {
    try {
      final api = ref.read(eventsApiProvider);
      final dateStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
      await api.markAttendanceById(eventCode, matric, present, date: dateStr);
      NotificationService.showSuccess(present ? 'Attendance marked present' : 'Attendance denied');
      if (context.mounted) {
        context.pop();
      }
    } catch (e) {
      NotificationService.showError(e);
      if (context.mounted) {
        context.pop();
      }
    }
  }
}