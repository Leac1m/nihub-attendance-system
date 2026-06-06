import { useAuth } from '../auth/useAuth';

export function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <button
      type="button"
      className="layout-logout"
      onClick={() => {
        void signOut();
      }}
    >
      Sign out
    </button>
  );
}
