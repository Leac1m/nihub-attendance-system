import 'dart:async';

enum AuthEvent { forceSignOut, silentRefreshFailed }

class AuthEventBus {
  static final AuthEventBus _instance = AuthEventBus._();
  factory AuthEventBus() => _instance;
  AuthEventBus._();

  final _controller = StreamController<AuthEvent>.broadcast();
  Stream<AuthEvent> get stream => _controller.stream;
  void emit(AuthEvent event) => _controller.add(event);
}
