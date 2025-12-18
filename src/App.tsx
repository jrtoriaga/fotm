import { Route, Routes } from "react-router-dom";
import "./App.css";
import Layout from "./layout";
import CalendarPage from "./pages/Calendar";
import CropsPage from "./pages/Crops";
import BirthdayCalendarPage from "./pages/BirthdayCalendar";
import CharactersPage from "./pages/Characters";
import ProfitabilityPage from "./pages/Profitability";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<CalendarPage />} />
        <Route path="/crops" element={<CropsPage />} />
        <Route path="/birthdays" element={<BirthdayCalendarPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/profitability" element={<ProfitabilityPage />} />
      </Route>
    </Routes>
  );
}

export default App;
