import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/network/error_handler.dart';
import '../../../core/services/notification_service.dart';
import 'departments_provider.dart';
import 'widgets/attendee_card.dart';

class ScanResultScreen extends ConsumerStatefulWidget {
  final String departmentCode;
  final String qrValue;

  const ScanResultScreen({
    super.key,
    required this.departmentCode,
    required this.qrValue,
  });

  @override
  ConsumerState<ScanResultScreen> createState() => _ScanResultScreenState();
}

class _ScanResultScreenState extends ConsumerState<ScanResultScreen> {
  List<Map<String, dynamic>> _todaySessions = [];
  bool _sessionsLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadTodaySessions();
  }

  Future<void> _loadTodaySessions() async {
    try {
      final api = ref.read(departmentsApiProvider);
      final today = DateTime.now();
      final sessions = await api.getSessionsForDate(widget.departmentCode, today);
      if (mounted) {
        setState(() {
          _todaySessions = sessions;
          _sessionsLoaded = true;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _sessionsLoaded = true;
        });
      }
    }
  }

  String? get _lastSessionType {
    if (_todaySessions.isEmpty) return null;
    return _todaySessions.last['session_type'] as String?;
  }

  @override
  Widget build(BuildContext context) {
    final registrantAsync = ref.watch(
      registrantDetailsProvider(
          (departmentCode: widget.departmentCode, registrantId: widget.qrValue)),
    );

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: registrantAsync.when(
          data: (attendee) {
            final lastType = _lastSessionType;
            final isCheckedIn = lastType == 'in';
            final isCheckedOut = lastType == 'out';

            return SingleChildScrollView(
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
                    const SizedBox(height: AppSpacing.xxxl),
                    AttendeeCard(attendee: attendee),
                    const SizedBox(height: AppSpacing.xxl),
                    if (!_sessionsLoaded)
                      const Center(
                        child: CircularProgressIndicator(color: AppColors.primary),
                      )
                    else if (isCheckedOut)
                      _buildSingleButton(
                        'Check In',
                        Icons.check_circle_outline,
                        AppColors.secondary,
                        () => _doCheckIn(widget.qrValue),
                      )
                    else if (isCheckedIn)
                      _buildSingleButton(
                        'Check Out',
                        Icons.cancel_outlined,
                        AppColors.error,
                        () => _doCheckOut(widget.qrValue),
                      )
                    else
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: AppSpacing.buttonHeight,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(color: AppColors.error, width: 2),
                              ),
                              child: OutlinedButton.icon(
                                onPressed: () => _doCheckOut(widget.qrValue),
                                icon: const Icon(Icons.cancel_outlined,
                                    color: AppColors.error, size: 20),
                                label: Text(
                                  'Check Out',
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
                          Expanded(
                            child: Container(
                              height: AppSpacing.buttonHeight,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(30),
                                boxShadow:
                                    AppShadows.buttonShadow(AppColors.primaryDeep),
                              ),
                              child: ElevatedButton.icon(
                                onPressed: () => _doCheckIn(widget.qrValue),
                                icon: const Icon(Icons.check_circle_outline,
                                    color: Colors.white, size: 20),
                                label: Text(
                                  'Check In',
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
            );
          },
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
                  style: GoogleFonts.inter(
                      color: AppColors.error, fontSize: 14),
                ),
                const SizedBox(height: AppSpacing.lg),
                ElevatedButton(
                  onPressed: () => context.pop(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                  child: Text('Go Back',
                      style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSingleButton(
    String label,
    IconData icon,
    Color color,
    VoidCallback onPressed,
  ) {
    return Container(
      height: AppSpacing.buttonHeight,
      width: double.infinity,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(30),
        boxShadow: AppShadows.buttonShadow(color),
      ),
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: Icon(icon, color: Colors.white, size: 20),
        label: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          elevation: 0,
        ),
      ),
    );
  }

  Future<void> _doCheckIn(String registrantId) async {
    try {
      final api = ref.read(departmentsApiProvider);
      await api.checkIn(widget.departmentCode, registrantId);
      NotificationService.showSuccess('Checked in');
      if (mounted) {
        context.pop();
      }
    } catch (e) {
      NotificationService.showError(e);
    }
  }

  Future<void> _doCheckOut(String registrantId) async {
    try {
      final api = ref.read(departmentsApiProvider);
      await api.checkOut(widget.departmentCode, registrantId);
      NotificationService.showSuccess('Checked out');
      if (mounted) {
        context.pop();
      }
    } catch (e) {
      NotificationService.showError(e);
    }
  }
}
