import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { Provider, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import Verify from "../screens/auth/Verify";
import store from "../redux/store";

// Mock Axios for API calls
vi.mock("axios");

// Mock useNavigate and useParams from react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: () => ({ token: "test-token" }),
  };
});

// Mock useSelector to return a mock auth state
vi.mock("react-redux", async () => {
  const actual = await vi.importActual("react-redux");
  return {
    ...actual,
    useSelector: vi.fn().mockReturnValue({ token: "user-token" }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(toast, "success").mockImplementation(() => {});
  vi.spyOn(toast, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Verify Component", () => {
  it("renders the loading state initially", () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/verify/test-token"]}>
          <Routes>
            <Route path="/verify/:token" element={<Verify />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/Verifying your email/i)).toBeInTheDocument();
  });

  it("shows success message and redirects on successful verification", async () => {
    axios.get.mockResolvedValueOnce({ data: {} });
 
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/verify/test-token"]}>
          <Routes>
            <Route path="/verify/:token" element={<Verify />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Email verified successfully!");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/settings?verified=true");
    });
  });

  it("shows unauthorized error if user is not logged in", async () => {
    // Mock useSelector to return no auth token
    vi.mocked(useSelector).mockReturnValue({ token: null });

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/verify/test-token"]}>
          <Routes>
            <Route path="/verify/:token" element={<Verify />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized: Please log in to verify your email.");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("shows error if verification link is invalid or expired", async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 400 } });

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/verify/test-token"]}>
          <Routes>
            <Route path="/verify/:token" element={<Verify />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Verification link is invalid or expired.");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/settings");
    });
  });

  it("shows unauthorized error if verification link is not for the user's account", async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 403 } });

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/verify/test-token"]}>
          <Routes>
            <Route path="/verify/:token" element={<Verify />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized: This link is not for your account.");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/settings");
    });
  });
});