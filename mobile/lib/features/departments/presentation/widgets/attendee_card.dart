import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/department_model.dart';

class AttendeeCard extends StatelessWidget {
  final Registrant attendee;

  const AttendeeCard({super.key, required this.attendee});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadiusLarge),
        border: Border.all(color: AppColors.borderCard),
        boxShadow: AppShadows.cardShadow,
      ),
      child: Column(
        children: [
          _buildAvatar(),
          const SizedBox(height: AppSpacing.md),
          Text(
            attendee.name,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
          if (attendee.email.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              attendee.email,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
          if (attendee.matricNumber != null &&
              attendee.matricNumber!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: Text(
                attendee.matricNumber!,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryDeep,
                  letterSpacing: 1.0,
                ),
              ),
            ),
          ],
          if (attendee.attendanceDays != null &&
              attendee.attendanceDays!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.lg),
            const Divider(),
            const SizedBox(height: AppSpacing.sm),
            _buildAttendanceSummary(),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    final photoUrl = attendee.photoUrl;
    if (photoUrl != null && photoUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(100),
        child: Image.network(
          photoUrl,
          width: 200,
          height: 200,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildInitials(),
        ),
      );
    }
    return _buildInitials();
  }

  Widget _buildInitials() {
    final initials = _initials(attendee.name);
    return Container(
      width: 200,
      height: 200,
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.15),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: GoogleFonts.inter(
          fontSize: 72,
          fontWeight: FontWeight.w800,
          color: AppColors.primaryDeep,
        ),
      ),
    );
  }

  static String _initials(String name) {
    if (name.isEmpty) return '?';
    final parts = name
        .split(' ')
        .where((p) => p.isNotEmpty)
        .map((p) => p[0])
        .toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.toUpperCase();
    return (parts[0] + parts[1]).toUpperCase();
  }

  Widget _buildAttendanceSummary() {
    final days = attendee.attendanceDays!;
    final present = days.where((d) => d.present).length;
    final total = days.length;
    final percentage = total > 0 ? (present / total * 100).round() : 0;

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Attendance: ',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            Text(
              '$percentage%',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: percentage >= 75
                    ? AppColors.secondary
                    : AppColors.error,
              ),
            ),
            Text(
              ' ($present/$total days)',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Wrap(
          spacing: 4,
          runSpacing: 4,
          alignment: WrapAlignment.center,
          children: days.take(14).map((d) {
            return Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: d.present
                    ? AppColors.secondary.withValues(alpha: 0.7)
                    : AppColors.error.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(2),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}