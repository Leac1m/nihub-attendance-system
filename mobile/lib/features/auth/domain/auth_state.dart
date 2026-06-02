class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final String? userEmail;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = true,
    this.userEmail,
  });

  AuthState copyWith({bool? isAuthenticated, bool? isLoading, String? userEmail}) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      userEmail: userEmail ?? this.userEmail,
    );
  }
}
