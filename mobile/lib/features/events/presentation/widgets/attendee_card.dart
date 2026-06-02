import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/event_model.dart';
import '../../../../core/theme/app_theme.dart';

class AttendeeCard extends StatelessWidget {
  final Registrant attendee;
  const AttendeeCard({
    super.key,
    required this.attendee,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadiusLarge),
        boxShadow: AppShadows.cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Profile image or avatar
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(AppSpacing.cardRadiusSmall),
              child: Container(
                width: double.infinity,
                height: 260,
                color: const Color(0xFFF2E6F7),
                child: attendee.photoUrl != null
                    ? Image.network(
                        attendee.photoUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _buildAvatarFallback(),
                      )
                    : _buildAvatarFallback(),
              ),
            ),
          ),
          // Info section
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpacing.cardPadding, 0, AppSpacing.cardPadding, AppSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Attendee ID
                Text(
                  'ID: ${attendee.id}'.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                // Name
                Text(
                  attendee.name,
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                // Info rows
                if (attendee.email.isNotEmpty) ...[
                  _infoRow(Icons.email_outlined, 'Email', attendee.email),
                  _divider(),
                ],
                if (attendee.phone != null && attendee.phone!.isNotEmpty) ...[
                  _infoRow(Icons.phone_outlined, 'Phone', attendee.phone!),
                  _divider(),
                ],
                if (attendee.matricNumber != null && attendee.matricNumber!.isNotEmpty) ...[
                  _infoRow(Icons.badge_outlined, 'Matric No', attendee.matricNumber!),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAvatarFallback() {
    final initials = attendee.name.isNotEmpty
        ? attendee.name.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase()
        : '?';
    return Center(
      child: Text(
        initials,
        style: GoogleFonts.inter(
          fontSize: 48,
          fontWeight: FontWeight.w800,
          color: AppColors.primaryDeep,
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
      child: Row(
        children: [
          Icon(icon, color: AppColors.textMuted, size: 22),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textMuted,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() {
    return Container(
      height: 1,
      color: AppColors.borderCard,
    );
  }
}