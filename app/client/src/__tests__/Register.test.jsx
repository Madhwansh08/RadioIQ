import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import store from "../redux/store";
import Register from "../screens/auth/Register";

// Mock assets (gif) to prevent loading issues
vi.mock("../../assets/RV_signup.gif", () => "mock-signup.gif");

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

describe("Register Component", () => {
  it("renders the register component correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText(/Sign up to RadioIQ/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the terms and conditions/i));
  });

  it("renders the form correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    expect(
      screen.getByPlaceholderText(/Enter your full name/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your Phone Number/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter email to get started/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your password/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign up/i })
    ).toBeInTheDocument();
  });

  it("updates the fields correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(nameInput.value).toBe("Jhon Doe");
    expect(phoneInput.value).toBe("9999999999");
    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });

  it("shows error if name is empty", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Name cannot be empty");
    });
  });

  it("shows error if email is invalid", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email format");
    });
  });

  it("shows error if password length is less than 8", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "passwo" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must contain at least 8 characters"
      );
    });
  });

  it("shows error if password does not contain an uppercase letter", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "password@123" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must contain at least one uppercase letter"
      );
    });
  });

  it("shows error if password does not contains a lowercase letter", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "PASSWORD@123" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must contain at least one lowercase letter"
      );
    });
  });

  it("shows error if password does not contains a number", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "password@A" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must contain at least one number"
      );
    });
  });

  it("shows error if password does not contains a special character", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });
    fireEvent.change(passwordInput, { target: { value: "Password123" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must contain at least one special character (!@#$%^&*)"
      );
    });
  });

  it("shows error if phone number is not 10 digits", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    const nameInput = screen.getByPlaceholderText(/Enter your full name/i);
    const phoneInput = screen.getByPlaceholderText(/Enter your Phone Number/i);
    const emailInput = screen.getByPlaceholderText(
      /Enter email to get started/i
    );
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    const submitButton = screen.getByRole("button", { name: /Sign up/i });

    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "99999999" } });
    fireEvent.change(passwordInput, { target: { value: "Password@123" } });

    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Phone number must be 10 digits"
      );
    });
  });

  it("shows error if T&C checkbox is not checked", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      {
        target: { value: "john@example.com" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "You must agree to the terms and conditions"
      );
    });
  });

  it("handles successful registration", async () => {
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { otpToken: "mockOtpToken" },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      {
        target: { value: "john@example.com" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account");
    });
  });

  it("handles registration failure due to API error", async () => {
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: "Registration failed due to server error" },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      { target: { value: "john@example.com" } }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error: Registration failed due to server error"
      );
    });
  });

  it("updates OTP fields correctly", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    // Simulate successful registration (move to OTP step)
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { otpToken: "mockOtpToken" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      { target: { value: "john@example.com" } }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account")
    );

    // OTP screen should now be visible
    expect(screen.getByTestId("otp-heading")).toBeInTheDocument();

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

  it("shows error when OTP field is empty", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { otpToken: "mockOtpToken" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      { target: { value: "john@example.com" } }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account")
    );

    // Navigate to OTP screen
    await waitFor(() => screen.getByTestId("otp-heading"));

    // Click verify OTP without entering anything
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid OTP, please try again");
    });
  });

  it("shows error when OTP field is incorrect", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    axios.post.mockResolvedValueOnce({
      status: 200,
      data: { otpToken: "mockOtpToken" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      { target: { value: "john@example.com" } }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account")
    );

    // Navigate to OTP screen
    await waitFor(() => screen.getByTestId("otp-heading"));

    const otpFields = screen.getAllByRole("textbox");
    otpFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `${index + 2}` } });
    });

    // Click verify OTP without entering anything
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid OTP, please try again");
    });
  });

  it("handles successful OTP verification", async () => {
    axios.post
      .mockResolvedValueOnce({
        status: 200,
        data: { otpToken: "mockOtpToken" },
      }) // Mock registration success
      .mockResolvedValueOnce({ status: 200 }); // Mock OTP verification success

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      {
        target: { value: "john@example.com" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account");
      expect(screen.getByTestId("otp-heading")).toBeInTheDocument();
    });

    const otpFields = screen.getAllByRole("textbox");
    otpFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Verification successful");
    });
  });

  it("navigates to login page after successful OTP verification", async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    axios.post
      .mockResolvedValueOnce({
        status: 200,
        data: { otpToken: "mockOtpToken" },
      }) // Mock registration success
      .mockResolvedValueOnce({ status: 200 }); // Mock OTP verification success

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      {
        target: { value: "john@example.com" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account");
      expect(screen.getByTestId("otp-heading")).toBeInTheDocument();
    });

    const otpFields = screen.getAllByRole("textbox");
    otpFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Verification successful");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("handles OTP verification failure due to API error", async () => {
    axios.post
      .mockResolvedValueOnce({
        status: 200,
        data: { otpToken: "mockOtpToken" },
      }) // Mock registration success
      .mockRejectedValueOnce({
        response: { data: { error: "Server error during OTP verification" } },
      }); // Mock OTP verification failure

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      {
        target: { value: "john@example.com" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account");
      expect(screen.getByTestId("otp-heading")).toBeInTheDocument();
    });

    const otpFields = screen.getAllByRole("textbox");
    otpFields.forEach((field, index) => {
      fireEvent.change(field, { target: { value: `${index + 1}` } });
    });

    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid OTP, please try again");
    });
  });

  it("navigates to login if skipped OTP verification", async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    axios.post
      .mockResolvedValueOnce({
        status: 200,
        data: { otpToken: "mockOtpToken" },
      }) // Mock registration success
      .mockResolvedValueOnce({ status: 200 }); // Mock OTP verification success

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(/Enter email to get started/i),
      {
        target: { value: "john@example.com" },
      }
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter your Phone Number/i), {
      target: { value: "9999999999" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: "Password@123" },
    });

    fireEvent.click(
      screen.getByLabelText(/I agree to the terms and conditions/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /Sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Please Verify the Account");
      expect(screen.getByTestId("otp-heading")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Skip/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
  
});
