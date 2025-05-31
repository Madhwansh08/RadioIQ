import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import store from "../redux/store";
import App from "../App";
import { expect } from "vitest";


test("renders RadioIQ entry point after loading", async () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // Ensure a loading state exists (use `queryAllByText` to avoid errors)
  expect(screen.queryAllByText(/Loading.../i).length).toBeGreaterThan(0);

  // Wait for loading state to be removed before checking final content
  await waitFor(() =>
    expect(
      screen.getByText(/Revolutionizing Healthcare with RadioVison/i)
    ).toBeInTheDocument()
  );
});
