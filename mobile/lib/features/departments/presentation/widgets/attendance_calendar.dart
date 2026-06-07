import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/services/notification_service.dart';
import '../../domain/department_model.dart';
import '../departments_provider.dart';

class AttendanceCalendarScreen extends ConsumerStatefulWidget {
  final String departmentCode;
  final String registrantId;

  const AttendanceCalendarScreen({
    super.key,
    required this.departmentCode,
    required this.registrantId,
  });

  @override
  ConsumerState<AttendanceCalendarScreen> createState() => _AttendanceCalendarScreenState();
}

class _AttendanceCalendarScreenState extends ConsumerState<AttendanceCalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  final Map<DateTime, int> _attendanceMap = {};

  @override
  Widget build(BuildContext context) {
    final registrantAsync = ref.watch(
      registrantDetailsProvider((departmentCode: widget.departmentCode, registrantId: widget.registrantId)),
    );

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.screenHorizontal,
                vertical: AppSpacing.lg,
              ),
              decoration: const BoxDecoration(color: AppColors.surface),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: AppColors.primaryDeep, size: 24),
                    onPressed: () => context.pop(),
                  ),
                  const Spacer(),
                  Text(
                    'Attendance',
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryDeep,
                    ),
                  ),
                  const Spacer(),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Expanded(
              child: registrantAsync.when(
                data: (registrant) {
                  _buildAttendanceMap(registrant.attendanceDays);
                  return _buildCalendar(registrant);
                },
                loading: () => const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
                error: (e, _) => Center(
                  child: Text('Error: $e', style: GoogleFonts.inter(color: AppColors.error)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _buildAttendanceMap(List<AttendanceDay>? days) {
    if (days == null) return;
    _attendanceMap.clear();
    for (final day in days) {
      final parts = day.date.split('-');
      if (parts.length == 3) {
        final date = DateTime(
          int.parse(parts[0]),
          int.parse(parts[1]),
          int.parse(parts[2]),
        );
        _attendanceMap[DateTime(date.year, date.month, date.day)] = day.present ? 2 : 0;
      }
    }
  }

  Widget _buildCalendar(Registrant registrant) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenHorizontal),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(AppSpacing.cardRadiusMedium),
              boxShadow: AppShadows.cardShadow,
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    _buildInitials(registrant.name),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            registrant.name,
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          if (registrant.matricNumber != null)
                            Text(
                              registrant.matricNumber!,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppColors.textMuted,
                                letterSpacing: 0.4,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                TableCalendar(
                  firstDay: DateTime.utc(2020, 1, 1),
                  lastDay: DateTime.utc(2030, 12, 31),
                  focusedDay: _focusedDay,
                  selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
                  calendarFormat: CalendarFormat.month,
                  headerStyle: HeaderStyle(
                    titleCentered: true,
                    formatButtonVisible: false,
                    titleTextStyle: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primaryDeep,
                    ),
                    leftChevronIcon: const Icon(Icons.chevron_left, color: AppColors.primaryDeep),
                    rightChevronIcon: const Icon(Icons.chevron_right, color: AppColors.primaryDeep),
                  ),
                  calendarStyle: CalendarStyle(
                    todayDecoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                    selectedDecoration: const BoxDecoration(
                      color: AppColors.primaryDeep,
                      shape: BoxShape.circle,
                    ),
                    markerDecoration: const BoxDecoration(
                      color: AppColors.secondary,
                      shape: BoxShape.circle,
                    ),
                  ),
                  calendarBuilders: CalendarBuilders(
                    markerBuilder: (context, date, events) {
                      final normalized = DateTime(date.year, date.month, date.day);
                      final status = _attendanceMap[normalized];
                      if (status == null) return null;
                      Color color;
                      if (status == 2) {
                        color = AppColors.secondary;
                      } else if (status == 1) {
                        color = Colors.orange;
                      } else {
                        color = AppColors.error;
                      }
                      return Positioned(
                        bottom: 1,
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                          ),
                        ),
                      );
                    },
                  ),
                  onDaySelected: (selectedDay, focusedDay) {
                    setState(() {
                      _selectedDay = selectedDay;
                      _focusedDay = focusedDay;
                    });
                    _showDaySheet(normalized: selectedDay);
                  },
                  onPageChanged: (focusedDay) {
                    setState(() => _focusedDay = focusedDay);
                  },
                ),
                const SizedBox(height: AppSpacing.md),
                _buildLegend(),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
        ],
      ),
    );
  }

  Widget _buildInitials(String name) {
    final initials = _initials(name);
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.15),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w800,
          color: AppColors.primaryDeep,
        ),
      ),
    );
  }

  static String _initials(String name) {
    if (name.isEmpty) return '?';
    final parts = name.split(' ').where((p) => p.isNotEmpty).map((p) => p[0]).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.toUpperCase();
    return (parts[0] + parts[1]).toUpperCase();
  }

  Widget _buildLegend() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _legendDot(AppColors.secondary, 'Present'),
        const SizedBox(width: AppSpacing.lg),
        _legendDot(Colors.orange, 'Partial'),
        const SizedBox(width: AppSpacing.lg),
        _legendDot(AppColors.error, 'Absent'),
        const SizedBox(width: AppSpacing.lg),
        _legendDot(AppColors.textMuted, 'No record'),
      ],
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
        ),
      ],
    );
  }

  void _showDaySheet({required DateTime normalized}) async {
    final status = _attendanceMap[normalized];
    final dateStr = '${normalized.year}-${normalized.month.toString().padLeft(2, '0')}-${normalized.day.toString().padLeft(2, '0')}';

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.cardRadiusLarge)),
      ),
      builder: (ctx) => _DayStatusSheet(
        dateStr: dateStr,
        currentStatus: status,
        onSelect: (newStatus) async {
          Navigator.pop(ctx);
          try {
            await ref.read(manualAttendanceProvider.notifier).set(
              widget.departmentCode,
              widget.registrantId,
              normalized,
              newStatus,
            );
            ref.invalidate(
              registrantDetailsProvider((departmentCode: widget.departmentCode, registrantId: widget.registrantId)),
            );
            setState(() {
              _attendanceMap[normalized] = newStatus;
            });
            NotificationService.showSuccess('Attendance updated');
          } catch (e) {
            NotificationService.showError(e);
          }
        },
      ),
    );
  }
}

class _DayStatusSheet extends StatefulWidget {
  final String dateStr;
  final int? currentStatus;
  final Future<void> Function(int status) onSelect;

  const _DayStatusSheet({
    required this.dateStr,
    required this.currentStatus,
    required this.onSelect,
  });

  @override
  State<_DayStatusSheet> createState() => _DayStatusSheetState();
}

class _DayStatusSheetState extends State<_DayStatusSheet> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.cardPadding),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.borderLight,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              widget.dateStr,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _statusLabel(widget.currentStatus),
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            Row(
              children: [
                Expanded(
                  child: _statusButton(
                    label: 'Present',
                    color: AppColors.secondary,
                    icon: Icons.check_circle,
                    status: 2,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _statusButton(
                    label: 'Partial',
                    color: Colors.orange,
                    icon: Icons.remove_circle,
                    status: 1,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: _statusButton(
                    label: 'Absent',
                    color: AppColors.error,
                    icon: Icons.cancel,
                    status: 0,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }

  String _statusLabel(int? status) {
    if (status == null) return 'No record';
    if (status == 2) return 'Present';
    if (status == 1) return 'Partial';
    return 'Absent';
  }

  Widget _statusButton({
    required String label,
    required Color color,
    required IconData icon,
    required int status,
  }) {
    return Container(
      height: 80,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(AppSpacing.cardRadiusSmall),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isLoading ? null : () async {
            setState(() => _isLoading = true);
            await widget.onSelect(status);
          },
          borderRadius: BorderRadius.circular(AppSpacing.cardRadiusSmall),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _isLoading
                  ? SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: color),
                    )
                  : Icon(icon, color: color, size: 28),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
