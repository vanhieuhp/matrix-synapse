import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { MatrixClientProvider } from './utils/MatrixContext'; // Import the MatrixProvider

ReactDOM.render(
  <MatrixClientProvider>
    <App />
  </MatrixClientProvider>,
  document.getElementById("root")
);