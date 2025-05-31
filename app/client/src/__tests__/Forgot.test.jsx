import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import userEvent from "@testing-library/user-event";
import { toast, ToastContainer } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import store from "../redux/store";
import Forgot from "../screens/auth/Forgot";

// Mock assets (gif) to prevent loading issues
vi.mock("../../assets/RV_forgotpassword.gif", () => "mock-forgot.gif");

// Mock Axios for API calls
vi.mock("axios");

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

  // Mock console log
  globalThis.console = {
    ...console,
    error: vi.fn(),
    log: vi.fn(),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Forgot Component", () => {
  it("renders the forgot component", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Enter your email to receive the OTP./i)
    ).toBeInTheDocument();
  });

  it("updates the email field", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  it("send OTP to user", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    // Input email
    userEvent.type(emailInput, "test@example.com");

    // Click Send OTP button
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
    });
  });

  it("shows error when sending OTP fails", async () => {
    axios.post.mockRejectedValueOnce(new Error("Failed to send OTP"));

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to send OTP. Please try again."
      );
    });
  });

  it("renders OTP input page after requesting OTP", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
      expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
    });
  });

  it("updates the otp input boxes correctly", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
      expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
    });

    // Enter OTP digits
    const otpFields = screen.getAllByRole("textbox");
    otpFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `${index + 1}` } });
    });

    // Expect OTP to be updated correctly
    otpFields.forEach((field, index) => {
      expect(field.value).toBe(`${index + 1}`);
    });
  });

  it("verifies the OTP", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP verified successfully", tempToken: "12345" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    // Step 1: Request OTP
    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
      expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
    });

    // Step 2: Enter OTP
    const otpInputs = screen.getAllByRole("textbox");
    otpInputs.forEach((input, index) => {
      userEvent.type(input, (index + 1).toString());
    });

    // Step 3: Click Verify OTP
    const verifyOtpButton = await screen.findByRole("button", {
      name: /Verify OTP/i,
    });
    userEvent.click(verifyOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP verified successfully");
    });
  });

  it("shows error if otp verification failed", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: "Registration failed due to server error" },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    // Step 1: Request OTP
    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
      expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
    });

    // Step 2: Enter OTP
    const otpInputs = screen.getAllByRole("textbox");
    otpInputs.forEach((input, index) => {
      userEvent.type(input, (index + 1).toString());
    });

    const verifyOtpButton = await screen.findByRole("button", {
      name: /Verify OTP/i,
    });
    userEvent.click(verifyOtpButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to verify OTP. Please try again."
      );
    });
  });

  it("renders password change page after successful OTP verification", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP verified successfully", tempToken: "12345" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
      expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole("textbox");
    otpInputs.forEach((input, index) => {
      userEvent.type(input, (index + 1).toString());
    });

    // Step 3: Click Verify OTP
    const verifyOtpButton = await screen.findByRole("button", {
      name: /Verify OTP/i,
    });
    userEvent.click(verifyOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP verified successfully");
      expect(screen.getByTestId("otp-heading3")).toBeInTheDocument();
    });
  });

  it("updates the new password field correctly", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP verified successfully", tempToken: "12345" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
      expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
    });

    // Enter OTP digits
    const otpFields = screen.getAllByRole("textbox");
    otpFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `${index + 1}` } });
    });

    // Verify the otp
    const verifyOtpButton = await screen.findByRole("button", {
      name: /Verify OTP/i,
    });
    userEvent.click(verifyOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP verified successfully");
      expect(screen.getByTestId("otp-heading3")).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/Enter new password/i);
    fireEvent.change(newPasswordInput, {
      target: { value: "Newpass@123" },
    });

    expect(newPasswordInput.value).toBe("Newpass@123");
  });

  it("updates the password successfully", async () => {
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP sent successfully" },
    });
    axios.post.mockResolvedValueOnce({
      data: { message: "OTP verified successfully", tempToken: "12345" },
    });
    axios.post.mockResolvedValueOnce({
      data: { message: "Password reset successfully" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <ToastContainer />
          <Forgot />
        </MemoryRouter>
      </Provider>
    );

    const emailInput = screen.getByPlaceholderText("Enter email");
    const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });

    userEvent.type(emailInput, "test@example.com");
    userEvent.click(sendOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
      expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByRole("textbox");
    otpInputs.forEach((input, index) => {
      userEvent.type(input, (index + 1).toString());
    });

    // Step 3: Click Verify OTP
    const verifyOtpButton = await screen.findByRole("button", {
      name: /Verify OTP/i,
    });
    userEvent.click(verifyOtpButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("OTP verified successfully");
      expect(screen.getByTestId("otp-heading3")).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/Enter new password/i);
    fireEvent.change(newPasswordInput, {
      target: { value: "Newpass@123" },
    });

    const resetButton = screen.getByRole("button", { name: /Reset Password/i });
    userEvent.click(resetButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Password reset successfully");
    });
  });

  it("shows error if otp verification failed", async () => {
    axios.post.mockResolvedValueOnce({
        data: { message: "OTP sent successfully" },
      });
      axios.post.mockResolvedValueOnce({
        data: { message: "OTP verified successfully", tempToken: "12345" },
      });
      axios.post.mockRejectedValueOnce({
        data: { message: "Failed to reset password. Please try again." },
      });
  
      render(
        <Provider store={store}>
          <MemoryRouter>
            <ToastContainer />
            <Forgot />
          </MemoryRouter>
        </Provider>
      );
  
      const emailInput = screen.getByPlaceholderText("Enter email");
      const sendOtpButton = screen.getByRole("button", { name: /Send OTP/i });
  
      userEvent.type(emailInput, "test@example.com");
      userEvent.click(sendOtpButton);
  
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("OTP sent successfully");
        expect(screen.getByTestId("otp-heading2")).toBeInTheDocument();
      });
  
      const otpInputs = screen.getAllByRole("textbox");
      otpInputs.forEach((input, index) => {
        userEvent.type(input, (index + 1).toString());
      });
  
      // Step 3: Click Verify OTP
      const verifyOtpButton = await screen.findByRole("button", {
        name: /Verify OTP/i,
      });
      userEvent.click(verifyOtpButton);
  
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("OTP verified successfully");
        expect(screen.getByTestId("otp-heading3")).toBeInTheDocument();
      });
  
      const newPasswordInput = screen.getByPlaceholderText(/Enter new password/i);
      fireEvent.change(newPasswordInput, {
        target: { value: "Newpass@123" },
      });
  
      const resetButton = screen.getByRole("button", { name: /Reset Password/i });
      userEvent.click(resetButton);
  
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to reset password. Please try again.");
      });
  });
});
