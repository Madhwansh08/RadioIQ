import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import { describe, it, vi, expect, beforeEach, afterEach } from "vitest";
import Header from "../components/Header";
import store from "../redux/store";

// Mock assets (image) to prevent loading issues
vi.mock("./assets/logo.png", () => "mock-image.png");

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

describe("Header Component", () => {
  it("renders the Header component correctly", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByAltText("CXR Vision Logo")).toBeInTheDocument();
  });

  it("navigates to home when logo is clicked", () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    );

    const logoButton = screen.getByAltText("CXR Vision Logo");
    fireEvent.click(logoButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("navigates to analysis page when X-ray Analysis is clicked", () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    );

    const analysisButton = screen.getByRole("button", { name: /Analysis/i });
    fireEvent.click(analysisButton);

    expect(mockNavigate).toHaveBeenCalledWith("/analysis/upload");
  });

  it("navigates to about page when About is clicked", () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    );
    
    const aboutButton = screen.getByRole("button", { name: /About/i });
    fireEvent.click(aboutButton);

    expect(mockNavigate).toHaveBeenCalledWith("/about");
  });

  it("navigates to login page when Log in is clicked", () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    );

    const loginButton = screen.getByRole("button", { name: /Log in/i });
    fireEvent.click(loginButton);

    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
