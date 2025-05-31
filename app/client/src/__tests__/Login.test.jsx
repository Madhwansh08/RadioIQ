import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import store from "../redux/store";
import Login from "../screens/auth/Login";
import { setAuth } from "../redux/slices/authSlice";

// Mock assets (gif) to prevent loading issues
vi.mock("../../assets/RV_login.gif", () => "mock-login.gif");

// Mock Axios for API calls
vi.mock("axios");

// Mock useDispatch to track actions
const mockDispatch = vi.fn();
vi.mock("react-redux", async () => {
  const actual = await vi.importActual("react-redux");
  return {
    ...actual,
    useDispatch: () => mockDispatch, // Mock useDispatch
  };
});

// Mock useNavigate from react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
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

describe("Login Component", () => {
  it("renders the login component", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByTestId("login-heading")).toBeInTheDocument();

  });

  it("renders the login form correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    );

    // Check for form fields
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByTestId("submit")).toBeInTheDocument();
  });

  it("updates input fields correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    );

    // Find the email and password fields
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    // Fire input events
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Check if the values update
    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("shows an error when submitting with an invalid email", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer /> {/* Ensure Toasts render */}
          <Login />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByTestId("submit");

    // Type an invalid email
    fireEvent.change(emailInput, { target: { value: "invalidemail" } });
    fireEvent.change(passwordInput, { target: { value: "Pass@1234" } }); // Keep password empty

    fireEvent.click(submitButton);

    // Wait for `toast.error` to be called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email format");
    });
  });

  it("shows an error when password field is empty", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
          <ToastContainer />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByTestId("submit");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "" } }); // Keep password empty

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Password cannot be empty");
    });
  });

  it("logs in successfully with valid credentials", async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        token: "mock-token",
        user: { name: "John Doe", email: "test@example.com" },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer /> {/* Ensure Toasts render */}
          <Login />
        </MemoryRouter>
      </Provider>
    );

    // Fill in correct credentials
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByTestId("submit");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    fireEvent.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login Success");
    });

    // Ensure setAuth was dispatched
    expect(mockDispatch).toHaveBeenCalledWith(
      setAuth({
        token: "mock-token",
        user: { name: "John Doe", email: "test@example.com" },
      })
    );
  });

  it("navigates to home page after successfull login", async () => {
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: {
        token: "mock-token",
        user: { name: "John Doe", email: "test@example.com" },
      },
    });

    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Login />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByTestId("submit");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    fireEvent.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Login Success");
    });

    // Ensure setAuth was dispatched
    expect(mockDispatch).toHaveBeenCalledWith(
      setAuth({
        token: "mock-token",
        user: { name: "John Doe", email: "test@example.com" },
      })
    );

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("shows an error message when login fails", async () => {
    // Mock API failure response
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: "Invalid credentials" },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer /> {/* Ensure Toasts render */}
          <Login />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByTestId("submit");

    fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });
});
