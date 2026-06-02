import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/services/notification_service.dart';
import 'events_provider.dart';

class CreateEventScreen extends ConsumerStatefulWidget {
  const CreateEventScreen({super.key});

  @override
  ConsumerState<CreateEventScreen> createState() => _CreateEventScreenState();
}

class _CreateEventScreenState extends ConsumerState<CreateEventScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _codeController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _durationController = TextEditingController(text: '1');
  String _unit = 'weeks';
  bool _isLoading = false;

  final List<String> _units = ['days', 'weeks', 'months'];

  @override
  void dispose() {
    _nameController.dispose();
    _codeController.dispose();
    _descriptionController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      await ref.read(eventsProvider.notifier).createCourse(
        name: _nameController.text.trim(),
        code: _codeController.text.trim().toUpperCase(),
        description: _descriptionController.text.trim(),
        duration: int.parse(_durationController.text),
        unit: _unit,
      );
      if (mounted) context.pop();
    } catch (e) {
      NotificationService.showError(e);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
          // Custom header matching React Native style
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.screenHorizontal,
              vertical: AppSpacing.lg,
            ),
            decoration: const BoxDecoration(color: AppColors.surface),
            child: Row(
              children: [
                // Back button
                IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppColors.primaryDeep, size: 24),
                  onPressed: () => context.pop(),
                ),
                const Spacer(),
                // Title
                Text(
                  'New Department',
                  style: GoogleFonts.inter(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primaryDeep,
                  ),
                ),
                const Spacer(),
                const SizedBox(width: 48), // Balance the back button
              ],
            ),
          ),
          // Form
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.screenHorizontal),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: AppSpacing.lg),
                    // Card with form
                    Container(
                      padding: const EdgeInsets.all(AppSpacing.cardPadding),
                      decoration: BoxDecoration(
                        color: AppColors.cardBg,
                        borderRadius: BorderRadius.circular(AppSpacing.cardRadiusMedium),
                        boxShadow: AppShadows.cardShadow,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Fill in the department details',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                              height: 1.5,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.xl),
                          // Department Name
                          _buildLabel('Department Name'),
                          const SizedBox(height: AppSpacing.sm),
                          TextFormField(
                            controller: _nameController,
                            style: GoogleFonts.inter(fontSize: 16),
                            decoration: _inputDecoration(Icons.event),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          // Department Code
                          _buildLabel('Department Code'),
                          const SizedBox(height: AppSpacing.sm),
                          TextFormField(
                            controller: _codeController,
                            textCapitalization: TextCapitalization.characters,
                            style: GoogleFonts.inter(fontSize: 16),
                            decoration: _inputDecoration(
                              Icons.code,
                              hintText: 'e.g. CS101',
                            ),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          // Description
                          _buildLabel('Description'),
                          const SizedBox(height: AppSpacing.sm),
                          TextFormField(
                            controller: _descriptionController,
                            maxLines: 4,
                            style: GoogleFonts.inter(fontSize: 16),
                            decoration: _inputDecoration(
                              Icons.description,
                              alignLabelWithHint: true,
                            ),
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          // Duration
                          _buildLabel('Duration'),
                          const SizedBox(height: AppSpacing.sm),
                          Row(
                            children: [
                              Expanded(
                                flex: 2,
                                child: TextFormField(
                                  controller: _durationController,
                                  keyboardType: TextInputType.number,
                                  style: GoogleFonts.inter(fontSize: 16),
                                  decoration: _inputDecoration(Icons.timer_outlined),
                                  validator: (v) {
                                    if (v == null || v.isEmpty) return 'Required';
                                    if (int.tryParse(v) == null) return 'Invalid';
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                flex: 3,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3F4F5),
                                    borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
                                    border: Border.all(color: AppColors.borderLight),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: _unit,
                                      isExpanded: true,
                                      style: GoogleFonts.inter(fontSize: 16, color: AppColors.textPrimary),
                                      items: _units.map((u) => DropdownMenuItem(
                                        value: u,
                                        child: Text(u, style: GoogleFonts.inter(fontSize: 16)),
                                      )).toList(),
                                      onChanged: (v) => setState(() => _unit = v!),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    // Submit button
                    Container(
                      height: AppSpacing.buttonHeight,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(999), // Pill shape
                        boxShadow: AppShadows.buttonShadow(AppColors.primaryDeep),
                      ),
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _create,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryDeep,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999),
                          ),
                          elevation: 0,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                                : Text(
                                'Create Department',
                                style: GoogleFonts.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
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

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(IconData icon, {String? hintText, bool alignLabelWithHint = false}) {
    return InputDecoration(
      prefixIcon: Icon(icon, color: AppColors.textMuted, size: 20),
      filled: true,
      fillColor: const Color(0xFFF3F4F5),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.lg,
      ),
      hintText: hintText,
      hintStyle: GoogleFonts.inter(fontSize: 16, color: AppColors.textMuted),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide: const BorderSide(color: AppColors.primaryDeep, width: 2),
      ),
      alignLabelWithHint: alignLabelWithHint,
    );
  }
}