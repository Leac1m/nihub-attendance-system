import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/department_model.dart';
import '../../../../core/theme/app_theme.dart';

enum TodayStatus { checkedIn, checkedOut, notCheckedIn }

enum RegistrantAction { checkIn, checkOut, viewDetails, edit, delete }

class RegistrantListTile extends StatelessWidget {
  final Registrant registrant;
  final TodayStatus todayStatus;
  final void Function(RegistrantAction action) onAction;
  final bool isAdmin;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const RegistrantListTile({
    super.key,
    required this.registrant,
    required this.todayStatus,
    required this.onAction,
    this.isAdmin = false,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadiusMedium),
        border: Border.all(color: AppColors.borderCard),
        boxShadow: AppShadows.cardShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            _buildAvatar(),
            const SizedBox(width: AppSpacing.md),
            Expanded(child: _buildInfo(context)),
            _buildStatusDot(),
            _buildTrailing(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusDot() {
    Color color;
    switch (todayStatus) {
      case TodayStatus.checkedIn:
        color = AppColors.secondary;
      case TodayStatus.checkedOut:
        color = AppColors.error;
      case TodayStatus.notCheckedIn:
        color = AppColors.textMuted;
    }
    return Container(
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: color,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildAvatar() {
    final photoUrl = registrant.photoUrl;
    if (photoUrl != null && photoUrl.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: Image.network(
          photoUrl,
          width: 56,
          height: 56,
          fit: BoxFit.cover,
          errorBuilder: (_, __, _) => _buildInitials(),
        ),
      );
    }
    return _buildInitials();
  }

  Widget _buildInitials() {
    final initials = _initials(registrant.name);
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.primaryLight.withValues(alpha: 0.15),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initials,
        style: GoogleFonts.inter(
          fontSize: 18,
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

  Widget _buildInfo(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          registrant.name,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        if (registrant.email.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            registrant.email,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
        ],
        if (registrant.matricNumber != null &&
            registrant.matricNumber!.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            registrant.matricNumber!,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildTrailing(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.more_vert, color: AppColors.textSecondary),
      onPressed: () => _showActionSheet(context),
    );
  }

  void _showActionSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppSpacing.cardRadiusLarge)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.cardPadding),
                child: Row(
                  children: [
                    _buildInitials(),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            registrant.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
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
              ),
              const SizedBox(height: 8),
              const Divider(height: 1),
              if (todayStatus == TodayStatus.notCheckedIn)
                _sheetTile(
                  context,
                  icon: Icons.check_circle_outline,
                  color: AppColors.secondary,
                  label: 'Check in',
                  onTap: () {
                    Navigator.pop(ctx);
                    onAction(RegistrantAction.checkIn);
                  },
                )
              else if (todayStatus == TodayStatus.checkedIn)
                _sheetTile(
                  context,
                  icon: Icons.cancel_outlined,
                  color: AppColors.error,
                  label: 'Check out',
                  onTap: () {
                    Navigator.pop(ctx);
                    onAction(RegistrantAction.checkOut);
                  },
                )
              else
                _sheetTile(
                  context,
                  icon: Icons.check_circle_outline,
                  color: AppColors.secondary,
                  label: 'Check in',
                  onTap: () {
                    Navigator.pop(ctx);
                    onAction(RegistrantAction.checkIn);
                  },
                ),
              _sheetTile(
                context,
                icon: Icons.info_outline,
                color: AppColors.primaryDeep,
                label: 'View details',
                onTap: () {
                  Navigator.pop(ctx);
                  onAction(RegistrantAction.viewDetails);
                },
              ),
              if (isAdmin) ...[
                const Divider(height: 1),
                _sheetTile(
                  context,
                  icon: Icons.edit,
                  color: AppColors.primaryDeep,
                  label: 'Edit registrant',
                  onTap: () {
                    Navigator.pop(ctx);
                    onAction(RegistrantAction.edit);
                  },
                ),
                _sheetTile(
                  context,
                  icon: Icons.delete,
                  color: AppColors.error,
                  label: 'Delete registrant',
                  onTap: () {
                    Navigator.pop(ctx);
                    onAction(RegistrantAction.delete);
                  },
                ),
              ],
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  Widget _sheetTile(
    BuildContext context, {
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
      onTap: onTap,
    );
  }
}
