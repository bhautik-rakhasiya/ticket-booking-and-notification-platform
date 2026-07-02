import { UserProvider, useUser } from "./context/UserContext";
import HomePage from "./pages/HomePage";
import { UserSelectionPage } from "./pages/UserSelectionPage";
import "./styles/global.css";

function AppRouter() {
  const { selectedUser } = useUser();
  return selectedUser ? <HomePage /> : <UserSelectionPage />;
}

function App() {
  return (
    <UserProvider>
      <AppRouter />
    </UserProvider>
  );
}

export default App;
