import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./app/store";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Здесь будут ваши маршруты */}
        </Routes>
      </Router>
    </Provider>
  );
}

export default App; 