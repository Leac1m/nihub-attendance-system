import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../domain/department_model.dart';
import '../../../admin/role_gate.dart';

class DepartmentCard extends ConsumerWidget {
  final DepartmentModel department;
  final int index;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback onDownload;
  final VoidCallback onViewRegistrants;

  const DepartmentCard({
    super.key,
    required this.department,
    required this.index,
    required this.onTap,
    required this.onDelete,
    required this.onDownload,
    required this.onViewRegistrants,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(AppSpacing.cardRadiusMedium),
        border: Border.all(color: AppColors.borderCard),
        boxShadow: AppShadows.cardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSpacing.cardRadiusMedium),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        department.code.isNotEmpty
                            ? department.code.substring(
                                0,
                                department.code.length > 2
                                    ? 2
                                    : department.code.length,
                              )
                            : '?',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primaryDeep,
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            department.name,
                            style: GoogleFonts.inter(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight
                                      .withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  department.code,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primaryDeep,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(
                                Icons.timer_outlined,
                                size: 12,
                                color: AppColors.textMuted,
                              ),
                              const SizedBox(width: 2),
                              Text(
                                department.duration,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert,
                          color: AppColors.textSecondary),
                      onSelected: (value) {
                        switch (value) {
                          case 'registrants':
                            onViewRegistrants();
                            break;
                          case 'download':
                            onDownload();
                            break;
                          case 'delete':
                            onDelete();
                            break;
                          case 'edit':
                            context.push('/departments/${department.code}/edit');
                            break;
                        }
                      },
                      itemBuilder: (context) => [
                        PopupMenuItem(
                          value: 'registrants',
                          child: Row(
                            children: [
                              const Icon(Icons.people,
                                  size: 20, color: AppColors.primaryDeep),
                              const SizedBox(width: 8),
                              Text('View Registrants',
                                  style: GoogleFonts.inter(fontSize: 14)),
                            ],
                          ),
                        ),
                        if (isAdmin(ref))
                          PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                const Icon(Icons.edit,
                                    size: 20, color: AppColors.primaryDeep),
                                const SizedBox(width: 8),
                                Text('Edit',
                                    style: GoogleFonts.inter(fontSize: 14)),
                              ],
                            ),
                          ),
                        PopupMenuItem(
                          value: 'download',
                          child: Row(
                            children: [
                              const Icon(Icons.download,
                                  size: 20, color: AppColors.secondary),
                              const SizedBox(width: 8),
                              Text('Download Sheet',
                                  style: GoogleFonts.inter(fontSize: 14)),
                            ],
                          ),
                        ),
                        if (isAdmin(ref))
                          PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                const Icon(Icons.delete,
                                    size: 20, color: AppColors.error),
                                const SizedBox(width: 8),
                                Text('Delete',
                                    style: GoogleFonts.inter(fontSize: 14)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onViewRegistrants,
                        icon:
                            const Icon(Icons.people, size: 18),
                        label: Text(
                          'Registrants',
                          style: GoogleFonts.inter(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primaryDeep,
                          side: const BorderSide(
                              color: AppColors.primaryLight),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppSpacing.buttonRadius),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: onTap,
                        icon: const Icon(Icons.qr_code_scanner, size: 18),
                        label: Text(
                          'Scan',
                          style: GoogleFonts.inter(
                              fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryDeep,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppSpacing.buttonRadius),
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
