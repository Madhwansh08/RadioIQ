import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../redux/store";
import About from "../screens/About";

describe("About Screen", () => {
  test("renders the About page header", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <About />
        </MemoryRouter>
      </Provider>
    );

    // Check if the main header is rendered
    expect(
      screen.getByText(/We’re a passionate group of people building the future of ecommerce/i)
    ).toBeInTheDocument();
  });

  test("renders timeline section", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <About />
        </MemoryRouter>
      </Provider>
    );

    // Check for a timeline event
    expect(screen.getByText(/Founded company/i)).toBeInTheDocument();
    expect(screen.getByText(/Aug 2021/i)).toBeInTheDocument();
  });

  
  test("renders footer content", () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <About />
        </MemoryRouter>
      </Provider>
    );

    // Check if the Footer component is rendered
    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
  });
});
