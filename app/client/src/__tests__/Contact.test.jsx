import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { Provider } from "react-redux";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import axios from "axios";
import store from "../redux/store";
import Contact from "../components/Contact";

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

// Mock Framer Motion to prevent animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
  },
  useAnimate: () => [{}], // Mock useAnimate
  useMotionValue: () => 0, // Mock useMotionValue
  useDragControls: () => ({
    start: vi.fn(), // Mock drag controls
  }),
  AnimatePresence: ({ children }) => <div>{children}</div>,
}));


beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(toast, "success").mockImplementation(() => {});
  vi.spyOn(toast, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Contact Component", () => {
  it("renders correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByText("We're here to help!")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Contact Support" })
    ).toBeInTheDocument();
  });

  it("opens the contact form drawer when Contact Support is clicked", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );

    const contactButton = screen.getByRole("button", {
      name: "Contact Support",
    });
    await userEvent.click(contactButton);

    expect(screen.getByText("Fill up the Details")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Leave a comment...")
    ).toBeInTheDocument();
  });

  it("validates that the form inputes are updated correctly", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );

    const contactButton = screen.getByRole("button", {
      name: "Contact Support",
    });
    await userEvent.click(contactButton);

    expect(screen.getByText("Fill up the Details")).toBeInTheDocument();
    const nameInput = screen.getByPlaceholderText("Enter your name");
    const emailInput = screen.getByPlaceholderText("Enter your email");
    const commentInput = screen.getByPlaceholderText("Leave a comment...");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(nameInput, { target: { value: "Jhon Doe" } });
    fireEvent.change(commentInput, { target: { value: "dummy comment.." } });

    expect(emailInput.value).toBe("test@example.com");
    expect(nameInput.value).toBe("Jhon Doe");
    expect(commentInput.value).toBe("dummy comment..");
  });

  it("validates form inputs and prevents submission with empty fields", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );
  
    // Open the contact form drawer
    const contactButton = screen.getByRole("button", {
      name: "Contact Support",
    });
    fireEvent.click(contactButton);
  
    // Select form inputs
    const nameInput = screen.getByPlaceholderText("Enter your name");
    const emailInput = screen.getByPlaceholderText("Enter your email");
    const commentInput = screen.getByPlaceholderText("Leave a comment...");
    const submitButton = screen.getByTestId("submit-button");
  
    // Clear the inputs
    fireEvent.change(emailInput, { target: { value: "" } });
    fireEvent.change(nameInput, { target: { value: "" } });
    fireEvent.change(commentInput, { target: { value: "" } });
  
    expect(emailInput.value).toBe("");
    expect(nameInput.value).toBe("");
    expect(commentInput.value).toBe("");
  
    fireEvent.click(submitButton);
  
    // Wait for validation to trigger
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("All fields are required");
    });
  
  });

  it("validates email format and prevents submission with invalid email", async () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );

    const contactButton = screen.getByRole("button", {
      name: "Contact Support",
    });
    await userEvent.click(contactButton);

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const emailInput = screen.getByPlaceholderText("Enter your email");
    const commentInput = screen.getByPlaceholderText("Leave a comment...");

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(nameInput, { target: { value: "dummyUser" } });
    fireEvent.change(commentInput, { target: { value: "dummy comment..." } });

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email format");
    });
  });

  it("submits the form successfully", async () => {
    axios.post.mockResolvedValue({ 
        status: 201 });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );

    const contactButton = screen.getByRole("button", {
      name: "Contact Support",
    });
    await userEvent.click(contactButton);

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const emailInput = screen.getByPlaceholderText("Enter your email");
    const commentInput = screen.getByPlaceholderText("Leave a comment...");

    fireEvent.change(emailInput, { target: { value: "user@gmail.com" } });
    fireEvent.change(nameInput, { target: { value: "dummyUser" } });
    fireEvent.change(commentInput, { target: { value: "dummy comment..." } });

    await fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Feedback submitted successfully"
      );
    });
  });

  it("navigates to home page after submit", async () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    axios.post.mockResolvedValue({ 
        status: 201 });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );

    const contactButton = screen.getByRole("button", {
      name: "Contact Support",
    });
    await userEvent.click(contactButton);

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const emailInput = screen.getByPlaceholderText("Enter your email");
    const commentInput = screen.getByPlaceholderText("Leave a comment...");

    fireEvent.change(emailInput, { target: { value: "user@gmail.com" } });
    fireEvent.change(nameInput, { target: { value: "dummyUser" } });
    fireEvent.change(commentInput, { target: { value: "dummy comment..." } });

    await fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Feedback submitted successfully"
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
  })

  it("handles server errors properly", async () => {
    axios.post.mockRejectedValue({
      response: { data: { message: "Server error occurred" } },
    });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Contact />
        </MemoryRouter>
      </Provider>
    );

    const contactButton = screen.getByRole("button", {
      name: "Contact Support",
    });
    await userEvent.click(contactButton);

    const nameInput = screen.getByPlaceholderText("Enter your name");
    const emailInput = screen.getByPlaceholderText("Enter your email");
    const commentInput = screen.getByPlaceholderText("Leave a comment...");

    fireEvent.change(emailInput, { target: { value: "email@email.com" } });
    fireEvent.change(nameInput, { target: { value: "dummyUser" } });
    fireEvent.change(commentInput, { target: { value: "dummy comment..." } });

    await userEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server error occurred");
    });
  });
});
