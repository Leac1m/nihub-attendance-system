enum AuthRole { unknown, staff, admin, registrant }

class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final AuthRole role;
  final String? username;
  final String? matriculationNumber;
  final String? departmentCode;
  final String? registrantId;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = true,
    this.role = AuthRole.unknown,
    this.username,
    this.matriculationNumber,
    this.departmentCode,
    this.registrantId,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    AuthRole? role,
    String? username,
    String? matriculationNumber,
    String? departmentCode,
    String? registrantId,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      role: role ?? this.role,
      username: username ?? this.username,
      matriculationNumber: matriculationNumber ?? this.matriculationNumber,
      departmentCode: departmentCode ?? this.departmentCode,
      registrantId: registrantId ?? this.registrantId,
    );
  }

  static const anonymous = AuthState(
    isAuthenticated: false,
    isLoading: false,
    role: AuthRole.unknown,
  );
}
