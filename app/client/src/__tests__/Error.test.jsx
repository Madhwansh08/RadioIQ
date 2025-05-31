import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { vi, expect, describe, test } from "vitest";
import ErrorPage from "../screens/Error";
import { Provider } from "react-redux";
import store from "../redux/store";
 
// Mock useNavigate from react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});
 
describe("ErrorPage Component", () => {
  test("renders the header", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>
      </Provider>
    );
 
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });
 
  test("displays the error image", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>
      </Provider>
    );
 
    const errorImage = screen.getByAltText("Error");
    expect(errorImage).toBeInTheDocument();
  });
 
  test("displays 404 and Page not found text", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>
      </Provider>
    );
 
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Sorry, we couldn’t find the page you’re looking for/i)
    ).toBeInTheDocument();
  });
 
  test("renders the Go back home button", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>
      </Provider>
    );
 
    const button = screen.getByRole("button", { name: /Go back home/i });
    expect(button).toBeInTheDocument();
  });
 
  test("navigates back home when button is clicked", () => {
    const mockNavigate = vi.fn();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
 
    render(
      <Provider store={store}>
        <MemoryRouter>
          <ErrorPage />
        </MemoryRouter>
      </Provider>
    );
 
    const button = screen.getByRole("button", { name: /Go back home/i });
    fireEvent.click(button);
 
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});