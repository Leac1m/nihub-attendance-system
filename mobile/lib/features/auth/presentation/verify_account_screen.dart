import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/notification_service.dart';
import 'auth_provider.dart';
import 'widgets/otp_input.dart';

class VerifyAccountScreen extends ConsumerStatefulWidget {
  final String username;

  const VerifyAccountScreen({super.key, required this.username});

  @override
  ConsumerState<VerifyAccountScreen> createState() => _VerifyAccountScreenState();
}

class _VerifyAccountScreenState extends ConsumerState<VerifyAccountScreen> {
  String _otp = '';

  Future<void> _verify() async {
    if (_otp.length != 6) {
      NotificationService.showError('Please enter the 6-digit code');
      return;
    }
    try {
      await ref.read(authStateProvider.notifier).verifyAccount(widget.username, _otp);
      if (mounted) context.go('/events');
    } catch (e) {
      NotificationService.showError(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.authBackground),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenHorizontal),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: AppSpacing.xxxl),
                  // Header with logo
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back_ios, color: AppColors.primaryDeep, size: 20),
                        onPressed: () => context.go('/signin'),
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            decoration: BoxDecoration(
                              color: AppColors.primaryDeep.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.shield, color: AppColors.primaryDeep, size: 18),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Text(
                            'NIHUB',
                            style: GoogleFonts.inter(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primaryDeep,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      const SizedBox(width: 48), // Balance the back button
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  // Hero section
                  Center(
                    child: Container(
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFBD6FF),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: AppShadows.cardShadow,
                      ),
                      child: const Icon(Icons.mark_email_read, color: AppColors.primaryDeep, size: 32),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(
                    'Check your email',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Enter the 6-digit code sent to your email',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  // Card with OTP
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.cardPadding),
                    decoration: BoxDecoration(
                      color: AppColors.cardBg,
                      borderRadius: BorderRadius.circular(AppSpacing.cardRadiusMedium),
                      boxShadow: AppShadows.cardShadow,
                    ),
                    child: Column(
                      children: [
                        OtpInput(
                          onChanged: (value) => _otp = value,
                        ),
                        const SizedBox(height: AppSpacing.lg),
                        // Username hint
                        Text(
                          'Code for: ${widget.username}',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.textMuted,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.xl),
                        // Verify button
                        Container(
                          height: AppSpacing.buttonHeight,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
                            boxShadow: AppShadows.buttonShadow(AppColors.primary),
                          ),
                          child: ElevatedButton(
                            onPressed: authState.isLoading ? null : _verify,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(AppSpacing.buttonRadius),
                              ),
                              elevation: 0,
                            ),
                            child: authState.isLoading
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        'Verify Account',
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(width: AppSpacing.sm),
                                      const Icon(Icons.verified, color: Colors.white, size: 18),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  // Footer with lock icon
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.lock_outlined, color: AppColors.textMuted, size: 14),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        'Secure encrypted verification',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    'Contact admin if you didn\'t receive the code',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}