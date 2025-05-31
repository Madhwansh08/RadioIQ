import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { act } from "react-dom/test-utils";
import PrivateRoute from "../routes/Private";
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/slices/authSlice";

// mock the spinner component
vi.mock("../components/Spinner.jsx", () => ({
  default: () => <span>MockSpinnerComponent</span>,
}));

// Mock Axios for API calls
vi.mock("axios");

describe("Private route Component", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { token: "valid_token" } },
    });
  });

  it("renders Outlet component when authenticated", async () => {
    axios.get.mockResolvedValue({ data: { ok: true } });

    await act(async () => {
      render(
        <Provider store={store}>
          <MemoryRouter initialEntries={["/private/test"]}>
            <Routes>
              <Route path="/private/*" element={<PrivateRoute />}>
                <Route path="test" element={<div>Authenticated Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    });

    await waitFor(() => {
      expect(screen.findByText("Authenticated Content")).resolves.toBeTruthy();
    });
  });

    it("renders Spinner when authentication check is pending", async () => {
      axios.get.mockImplementation(() => new Promise(() => {}));

      render(
        <Provider store={store}>
          <MemoryRouter>
            <PrivateRoute />
          </MemoryRouter>
        </Provider>
      );

      expect(screen.getByText("MockSpinnerComponent")).toBeInTheDocument();
    });

    it("renders Spinner when authentication fails", async () => {
      axios.get.mockRejectedValue(new Error("Unauthorized"));
      render(
        <Provider store={store}>
          <MemoryRouter>
            <PrivateRoute />
          </MemoryRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText("MockSpinnerComponent")).toBeInTheDocument();
      });
    });

    it("renders Spinner when there is no token", async () => {
        store = configureStore({
          reducer: { auth: authReducer },
          preloadedState: { auth: {} },
        });
    
        render(
          <Provider store={store}>
            <MemoryRouter>
              <PrivateRoute />
            </MemoryRouter>
          </Provider>
        );
    
        await waitFor(() => {
            expect(screen.getByText("MockSpinnerComponent")).toBeInTheDocument();
          });
      });
});
