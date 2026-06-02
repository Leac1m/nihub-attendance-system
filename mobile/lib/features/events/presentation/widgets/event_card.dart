import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../domain/event_model.dart';
import '../../../../core/theme/app_theme.dart';

class EventCard extends StatelessWidget {
  final EventModel event;
  final int index;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback onDownload;

  const EventCard({
    super.key,
    required this.event,
    required this.index,
    required this.onTap,
    required this.onDelete,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    final accentColor = AppColors.getEventAccent(index);
    final bgAccentColor = AppColors.getEventBgAccent(index);

    return Dismissible(
      key: Key(event.code),
      direction: DismissDirection.endToStart,
      confirmDismiss: (_) async {
        return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(
              'Delete Event',
              style: GoogleFonts.inter(fontWeight: FontWeight.w700),
            ),
            content: Text(
              'Delete "${event.name}"? This cannot be undone.',
              style: GoogleFonts.inter(),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text(
                  'Cancel',
                  style: GoogleFonts.inter(color: AppColors.textSecondary),
                ),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(
                  'Delete',
                  style: GoogleFonts.inter(color: AppColors.error, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ) ?? false;
      },
      onDismissed: (_) => onDelete(),
      background: Container(
        height: 120,
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(AppSpacing.cardRadiusLarge),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.delete_outline, color: Colors.white, size: 28),
            const SizedBox(height: 4),
            Text(
              'Delete',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: AppColors.cardBg,
            borderRadius: BorderRadius.circular(AppSpacing.cardRadiusLarge),
            border: Border.all(color: AppColors.borderCard),
            boxShadow: AppShadows.cardShadow,
          ),
          child: Stack(
            children: [
              // Decorative accent circle in top-right
              Positioned(
                top: -45,
                right: -45,
                child: Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    color: bgAccentColor,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(AppSpacing.cardPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Event name
                        Expanded(
                          child: Text(
                            event.name,
                            style: GoogleFonts.inter(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        // Code badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            border: Border.all(color: accentColor.withValues(alpha: 0.3)),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            event.code,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: accentColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.md),
                    // Description
                    if (event.description.isNotEmpty) ...[
                      Text(
                        event.description,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                    ],
                    // Divider
                    Container(
                      height: 1,
                      color: AppColors.borderCard,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    // Footer with duration and download
                    Row(
                      children: [
                        Icon(Icons.schedule, color: AppColors.textSecondary, size: 18),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          event.duration,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        // Download button
                        GestureDetector(
                          onTap: onDownload,
                          child: Icon(Icons.download, color: AppColors.primaryDeep, size: 24),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}