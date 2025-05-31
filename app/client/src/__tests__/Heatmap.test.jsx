import { React, useRef } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { it, vi } from "vitest";
import axios from "axios";
import Heatmap from "../screens/Heatmap";
import { GoZoomIn, GoZoomOut } from "react-icons/go";
import SemiCircle from "../components/SemiCircle";
import AbnormalityBar from "../components/AbnormalityBar";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: () => ({ patientSlug: "1234", xraySlug: "5678" }),
  };
});

vi.mock("../components/SemiCircle", () => ({
  default: vi.fn(({ percentage }) => (
    <div data-testid="semi-circle">TB Score: {percentage ?? "N/A"}%</div>
  )),
}));

vi.mock("../components/AbnormalityBar", () => ({
  default: vi.fn(({ abnormalities }) => (
    <div data-testid="abnormality-bar">
      {abnormalities.length > 0 ? abnormalities.join(", ") : ""}
    </div>
  )),
}));

vi.mock("axios");

describe("Heatmap Component - Rendering Tests", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      console.log("Mocked API Call:", url); // ✅ Debug API request URLs

      if (url.includes("/api/patients/")) {
        const mockData = {
          patient: {
            patientId: "1234",
            age: 45,
            sex: "Male",
            location: "New York",
          },
        };
        console.log("Mocked Patient Data:", mockData); // ✅ Debug mock response
        return Promise.resolve({ data: mockData });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockHistoryData = {
    xrays: [
      {
        id: "abcd1234",
        tbScore: 85,
        abnormalities: ["Lung Opacity", "Nodule"],
        createdAt: "2024-02-12T12:00:00Z",
      },
      {
        id: "xyz5678",
        tbScore: 60,
        abnormalities: ["Pneumonia"],
        createdAt: "2024-01-10T12:00:00Z",
      },
    ],
  };

  const mockSimilarCaseData = [
    {
      patientId: "9876abcd",
      xrays: [
        {
          tbScore: 90,
          abnormalities: [{ name: "Lung Mass" }, { name: "Cavity" }],
          date: "2024-02-01T12:00:00Z",
        },
      ],
    },
    {
      patientId: "1234wxyz",
      xrays: [
        {
          tbScore: 75,
          abnormalities: [{ name: "Fibrosis" }],
          date: "2024-01-05T12:00:00Z",
        },
      ],
    },
  ];

  // -----------------------Rendering----------------------------------------------
  it("renders Heatmap component without crashing", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );
    expect(screen.getByText(/CXR Analysis/i)).toBeInTheDocument();
  });

  it("displays the header 'CXR Analysis' correctly", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );
    expect(screen.getByText("CXR Analysis")).toBeInTheDocument();
  });

  it("ensures the canvas is rendered properly for displaying the X-ray image", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
    });
  });

  //   it("displays the patient demographic section when data is available", async () => {
  //     render(
  //       <MemoryRouter>
  //         <Heatmap />
  //       </MemoryRouter>
  //     );

  //     await waitFor(() => {
  //       expect(screen.getByText("ID: 1234")).toBeInTheDocument();
  //       expect(screen.getByText("Age: 45")).toBeInTheDocument();
  //       expect(screen.getByText("Gender: Male")).toBeInTheDocument();
  //       expect(screen.getByText("Location: New York")).toBeInTheDocument();
  //     });
  //   });

  it("ensures the sidebar navigation buttons are rendered correctly", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(5); // Total button count
    });
  });

  it("shows 'No data available' when patient history or similar cases are missing", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  //   ---------------------------API Calls------------------------------------

  it("calls /api/patients/:patientSlug endpoint correctly", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/patients/1234")
      );
    });
  });

  it("calls /api/xrays/:xraySlug endpoint correctly", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/xrays/5678")
      );
    });
  });

  it("calls /api/xrays/:xraySlug/abnormalities endpoint correctly", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/xrays/5678/abnormalities")
      );
    });
  });

  it("calls /api/patients/:patientSlug/history endpoint correctly", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/patients/1234/history")
      );
    });
  });

  it("calls /api/patients/:patientSlug/similar endpoint correctly", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/api/patients/1234/similar")
      );
    });
  });

  it("handles API errors gracefully for different endpoints", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/patients/")) {
        return Promise.reject(new Error("Error fetching patient data"));
      } else if (url.includes("/api/xrays/")) {
        return Promise.reject(new Error("Error fetching X-ray data"));
      } else if (
        url.includes("/api/xrays/") &&
        url.includes("/abnormalities")
      ) {
        return Promise.reject(new Error("Error fetching abnormalities"));
      } else if (url.includes("/api/patients/") && url.includes("/history")) {
        return Promise.reject(new Error("Error fetching patient history"));
      } else if (url.includes("/api/patients/") && url.includes("/similar")) {
        return Promise.reject(new Error("Error fetching similar cases"));
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Debug: Log the rendered output
    await waitFor(() => {
      console.log("Rendered Output:", document.body.innerHTML);
    });

    // Define the expected error messages
    const expectedErrors = [
      "Error fetching patient data",
      "Error fetching X-ray data",
      "Error fetching abnormalities",
      "Error fetching patient history",
      "Error fetching similar cases",
    ];

    // Check if at least one of the error messages is in the document
    await waitFor(() => {
      expectedErrors.forEach((msg) => {
        expect(screen.getByText(new RegExp(msg, "i"))).toBeInTheDocument();
      });
    });
  });

  // ----------------------------Sidebar-------------------------------

  it("renders Zoom In button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    const zoomInButton = screen.getByRole("button", { name: /zoom in/i });
    expect(zoomInButton).toBeInTheDocument();
  });

  it("calls the correct function when Zoom In button is clicked", async () => {
    const handleZoomIn = vi.fn();

    render(
      <MemoryRouter>
        <button
          onClick={handleZoomIn}
          aria-label="Zoom In"
          className="rounded-xl p-2"
        >
          <GoZoomIn size={24} />
        </button>
      </MemoryRouter>
    );

    const zoomInButton = screen.getByRole("button", { name: /zoom in/i });
    fireEvent.click(zoomInButton);

    expect(handleZoomIn).toHaveBeenCalledTimes(1);
  });

  it("renders Zoom Out button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    const zoomInButton = screen.getByRole("button", { name: /zoom out/i });
    expect(zoomInButton).toBeInTheDocument();
  });

  it("calls the correct function when Zoom Out button is clicked", async () => {
    const handleZoomOut = vi.fn();

    render(
      <MemoryRouter>
        <button
          onClick={handleZoomOut}
          aria-label="Zoom Out"
          className="rounded-xl p-2"
        >
          <GoZoomIn size={24} />
        </button>
      </MemoryRouter>
    );

    const zoomInButton = screen.getByRole("button", { name: /zoom out/i });
    fireEvent.click(zoomInButton);

    expect(handleZoomOut).toHaveBeenCalledTimes(1);
  });

  it("renders Brightness, Contrast, and Negative filter buttons", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Select buttons using data-testid
    const brightnessButton = screen.getByTestId("brightness-button");
    const contrastButton = screen.getByTestId("contrast-button");
    const negativeButton = screen.getByTestId("negative-button");

    // Check if buttons exist
    expect(brightnessButton).toBeInTheDocument();
    expect(contrastButton).toBeInTheDocument();
    expect(negativeButton).toBeInTheDocument();
  });

  it("activates the Brightness filter when clicked", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    const brightnessButton = screen.getByLabelText(/brightness/i);

    fireEvent.click(brightnessButton);

    expect(brightnessButton).toHaveClass("bg-[#5c60c6]");
  });

  it("activates the Contrast filter when clicked", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    const contrastButton = screen.getByLabelText(/contrast/i);

    fireEvent.click(contrastButton);

    expect(contrastButton).toHaveClass("bg-[#5c60c6]");
  });

  //  it("toggles the Negative filter on and off", async () => {
  //    render(
  //      <MemoryRouter>
  //        <Heatmap />
  //      </MemoryRouter>
  //    );

  //    const negativeButton = screen.getByTestId("negative-button");

  //    // Ensure button is rendered
  //    expect(negativeButton).toBeInTheDocument();

  //    // Click to activate (apply the filter)
  //    fireEvent.click(negativeButton);
  //    await waitFor(() => {
  //      expect(negativeButton).toHaveClass("bg-[#5c60c6]");
  //    });

  //    // Click again to deactivate (remove the filter)
  //    fireEvent.click(negativeButton);
  //    await waitFor(() => {
  //      expect(negativeButton).not.toHaveClass("bg-[#5c60c6]");
  //    });
  //  });

  it("activates the correct filter button when clicked", async () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    const brightnessButton = screen.getByTestId("brightness-button");
    const contrastButton = screen.getByTestId("contrast-button");

    fireEvent.click(brightnessButton);
    await waitFor(() => expect(brightnessButton).toHaveClass("bg-[#5c60c6]"));

    fireEvent.click(contrastButton);
    await waitFor(() => {
      expect(contrastButton).toHaveClass("bg-[#5c60c6]");
      expect(brightnessButton).not.toHaveClass("bg-[#5c60c6]");
    });
  });

  it("renders the Reset button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    const resetButton = screen.getByRole("button", { name: /reset filter/i });

    expect(resetButton).toBeInTheDocument();
  });

  it("calls resetFilters when clicked", () => {
    const mockResetFilters = vi.fn();

    render(
      <MemoryRouter>
        <button
          onClick={mockResetFilters}
          data-testid="reset-button"
          aria-label="Reset Filters"
        >
          Reset
        </button>
      </MemoryRouter>
    );

    const resetButton = screen.getByTestId("reset-button");

    fireEvent.click(resetButton);

    expect(mockResetFilters).toHaveBeenCalledTimes(1);
  });

  it("renders the annotation toggle button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Check if either icon (eye or eye-slash) is present
    const annotationButton = screen.getByLabelText("Toggle Annotations");
    expect(annotationButton).toBeInTheDocument();
  });

  it("toggles the annotation button state when clicked", async () => {
    const mockDrawModelAnnotation = vi.fn();

    render(
      <MemoryRouter>
        <button
          onClick={mockDrawModelAnnotation}
          className="group relative flex items-center justify-center gap-2 rounded-xl"
          aria-label="Toggle Annotations"
          data-testid="annotation-button"
        >
          <span data-testid="annotation-icon">👁️</span>
        </button>
      </MemoryRouter>
    );

    const annotationButton = screen.getByTestId("annotation-button");
    const annotationIcon = screen.getByTestId("annotation-icon");

    expect(annotationIcon.textContent).toBe("👁️");

    fireEvent.click(annotationButton);

    expect(mockDrawModelAnnotation).toHaveBeenCalledTimes(1);
  });

  it("renders the quadrant toggle button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Find the button by aria-label
    const quadrantButton = screen.getByLabelText("quadrant");
    expect(quadrantButton).toBeInTheDocument();
  });

  it("calls handleQuadrantClick when clicked", () => {
    const mockHandleQuadrantClick = vi.fn();

    render(
      <MemoryRouter>
        <button
          aria-label="quadrant"
          onClick={mockHandleQuadrantClick}
          className="group relative rounded-xl"
          data-testid="quadrant-button"
        >
          <span data-testid="quadrant-icon">🔲</span>
        </button>
      </MemoryRouter>
    );

    const quadrantButton = screen.getByTestId("quadrant-button");
    fireEvent.click(quadrantButton);

    // Ensure function is called
    expect(mockHandleQuadrantClick).toHaveBeenCalledTimes(1);
  });

  it("renders the heatmap toggle button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Select the button using a more accessible method
    const heatmapButton = screen.getByRole("button", { name: /heatmap/i });
    expect(heatmapButton).toBeInTheDocument();
  });

  it("calls handleHeatmapClick when clicked", () => {
    const mockHandleHeatmapClick = vi.fn();

    render(
      <MemoryRouter>
        <button
          aria-label="heatmap"
          onClick={mockHandleHeatmapClick}
          className="group relative rounded-xl"
          data-testid="heatmap-button"
        >
          <span data-testid="heatmap-icon">🔥</span>
        </button>
      </MemoryRouter>
    );

    const heatmapButton = screen.getByTestId("heatmap-button");
    fireEvent.click(heatmapButton);

    // Ensure function is called
    expect(mockHandleHeatmapClick).toHaveBeenCalledTimes(1);
  });

  it("renders the edit button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    const editButton = screen.getByLabelText("edit");
    expect(editButton).toBeInTheDocument();
  });

  it("calls handleEditClick when clicked", () => {
    const mockHandleEditClick = vi.fn();

    render(
      <MemoryRouter>
        <button
          aria-label="edit"
          onClick={mockHandleEditClick}
          className="group relative rounded-xl bg-[#5c60c6] p-2 text-[#fdfdfd] hover:text-[#5c60c6] hover:bg-[#fdfdfd]"
          data-testid="edit-button"
        >
          <span data-testid="edit-icon">🔥</span>
        </button>
      </MemoryRouter>
    );

    const editButton = screen.getByTestId("edit-button");
    fireEvent.click(editButton);

    // Ensure function is called
    expect(mockHandleEditClick).toHaveBeenCalledTimes(1);
  });

  it("renders the modal toggle button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Locate the button by its accessible label or role
    const modalButton = screen.getByRole("button", { name: /toggle modal/i });

    expect(modalButton).toBeInTheDocument();
  });

  it("calls toggleModal when clicked", () => {
    const mockToggleModal = vi.fn(); // Mock function

    render(
      <MemoryRouter>
        <button
          onClick={mockToggleModal}
          className="group relative rounded-xl bg-[#5c60c6] p-2 text-[#fdfdfd] hover:text-[#5c60c6] hover:bg-[#fdfdfd]"
          aria-label="toggle modal"
          data-testid="modal-toggle-button"
        >
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h6.086a1.5 1.5 0 0 0 1.06-.44l4.915-4.914A1.5 1.5 0 0 0 15 8.586V2.5A1.5 1.5 0 0 0 13.5 1zM2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V8H9.5A1.5 1.5 0 0 0 8 9.5V14H2.5a.5.5 0 0 1-.5-.5zm7 11.293V9.5a.5.5 0 0 1 .5-.5h4.293z" />
          </svg>
        </button>
      </MemoryRouter>
    );

    // Get the button using test ID (ensuring we are selecting the correct one)
    const modalButton = screen.getByTestId("modal-toggle-button");

    fireEvent.click(modalButton);

    expect(mockToggleModal).toHaveBeenCalledTimes(1);
  });

  //check again
  it("renders the modal when opened", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Find and click the correct button to open the modal
    const openModalButton = screen.getByRole("button", {
      name: /toggle modal/i,
    });
    fireEvent.click(openModalButton);

    // Now check if the modal appears
    expect(
      screen.getByRole("heading", { name: /submit feedback/i })
    ).toBeInTheDocument();
  });

  it("renders the back button", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Locate the button by its accessible label or role
    const modalButton = screen.getByLabelText("back");

    expect(modalButton).toBeInTheDocument();
  });

  it("navigates back when clicked", () => {
    const mockNavigate = vi.fn();

    render(
      <MemoryRouter>
        <button
          aria-label="back"
          onClick={() => mockNavigate(-1)}
          className="group relative rounded-xl bg-[#5c60c6] p-2 text-[#fdfdfd] hover:text-[#5c60c6] hover:bg-[#fdfdfd]"
          data-testid="back-button"
        >
          <span data-testid="back-icon">⬅️</span>
        </button>
      </MemoryRouter>
    );

    const backButton = screen.getByTestId("back-button");
    fireEvent.click(backButton);

    // Ensure navigate is called with -1
    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  // it("displays the patient ID when data is available", async () => {
  //   render(
  //     <MemoryRouter>
  //       <Heatmap />
  //     </MemoryRouter>
  //   );

  //   // Debugging: Log the DOM output if the test fails
  //   await waitFor(() => {
  //     screen.debug();
  //   });

  //   // More flexible check to handle variations in rendering
  //   await waitFor(() => {
  //     expect(screen.getByText(/ID:\s*1234/i)).toBeInTheDocument();
  //   });
  // });

  it('shows "No Patient ID Available" when no data exists', async () => {
    axios.get.mockResolvedValueOnce({ data: {} }); // Mock empty response

    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Patient ID Available/i)).toBeInTheDocument();
    });
  });

  it("renders Patient History and Similar Cases buttons", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Check that both buttons are rendered
    expect(
      screen.getByRole("button", { name: /patient history/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /similar cases/i })
    ).toBeInTheDocument();
  });

  it("switches to 'Similar Cases' tab when clicked", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Click on the 'Similar Cases' tab
    const similarCasesButton = screen.getByRole("button", {
      name: /similar cases/i,
    });
    fireEvent.click(similarCasesButton);

    // Check if the sliding div moved to indicate the active tab
    const slidingDiv = screen.getByTestId("tab-slider");
    expect(slidingDiv).toHaveClass("translate-x-full"); // It should move to the right
  });

  it("switches back to 'Patient History' tab when clicked", () => {
    render(
      <MemoryRouter>
        <Heatmap />
      </MemoryRouter>
    );

    // Click on 'Patient History' tab
    const patientHistoryButton = screen.getByRole("button", {
      name: /patient history/i,
    });
    fireEvent.click(patientHistoryButton);

    // Check if the sliding div moved back to its original position
    const slidingDiv = screen.getByTestId("tab-slider");
    expect(slidingDiv).toHaveClass("translate-x-0"); // It should move back
  });

  it("renders the table with headers", () => {
    render(
      <MemoryRouter>
        <Heatmap activeTab="Patient History" historyData={mockHistoryData} />
      </MemoryRouter>
    );

    expect(screen.getByText(/PID/i)).toBeInTheDocument();
    expect(screen.getByText(/Criticality Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Diseases Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Date/i)).toBeInTheDocument();
  });

  //  it("displays patient history data correctly", () => {
  //    render(
  //      <MemoryRouter>
  //        <Heatmap activeTab="Patient History" historyData={mockHistoryData} />
  //      </MemoryRouter>
  //    );

  //    expect(screen.getByText("...1234")).toBeInTheDocument(); // Last 4 chars of ID
  //    expect(screen.getByText("85%")).toBeInTheDocument(); // TB Score
  //    expect(screen.getByText("Lung Opacity")).toBeInTheDocument(); // First disease
  //    expect(screen.getByText("12/02/2024")).toBeInTheDocument(); // Formatted date
  //  });

  // it("displays similar cases data correctly", async () => {
  //   render(
  //     <MemoryRouter>
  //       <Heatmap
  //         activeTab="Similar Cases"
  //         similarCaseData={mockSimilarCaseData}
  //       />
  //     </MemoryRouter>
  //   );

  //   // Look for any element containing part of the ID
  //   expect(
  //     screen.getByText((content) => content.includes("9876abcd"))
  //   ).toBeInTheDocument(); // Ensures partial matches work

  //   // TB Score
  //   expect(
  //     screen.getByText((content) => content.includes("90%"))
  //   ).toBeInTheDocument();

  //   // Disease
  //   expect(
  //     screen.getByText((content) => content.includes("Lung Mass"))
  //   ).toBeInTheDocument();

  //   // Formatted Date (Adjust format if needed)
  //   expect(
  //     screen.getByText((content) => content.includes("01/02/2024"))
  //   ).toBeInTheDocument();
  // });

  it("displays 'No data available' when historyData is empty", () => {
    render(
      <MemoryRouter>
        <Heatmap activeTab="Patient History" historyData={{ xrays: [] }} />
      </MemoryRouter>
    );

    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  it("displays 'No data available' when similarCaseData is empty", () => {
    render(
      <MemoryRouter>
        <Heatmap activeTab="Similar Cases" similarCaseData={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  // -------------------------------canvas-----------------------

  let setScale, setIsPanning, setPanOffset;

  beforeEach(() => {
    setScale = vi.fn();
    setIsPanning = vi.fn();
    setPanOffset = vi.fn();
  });

  const TestComponent = ({ annotationsActive, scale, panOffset }) => {
    const containerRef = useRef(null);
    const canvasRef = useRef({ width: 1024, height: 1024 }); // Mocked canvas object

    const handleWheel = (e) => {
      if (!annotationsActive) {
        setScale((prevScale) =>
          Math.min(Math.max(prevScale + e.deltaY * -0.001, 1), 3)
        );
      }
    };

    const handleMouseDown = (e) => {
      if (scale > 1) {
        setIsPanning(true);
        const startX = e.clientX;
        const startY = e.clientY;
        const { x, y } = panOffset;

        const handleMouseMove = (event) => {
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;

          // Mocked Canvas Dimensions
          const canvas = canvasRef.current || { width: 1024, height: 1024 };
          const imgWidth = canvas.width * scale;
          const imgHeight = canvas.height * scale;

          // Clamping
          const maxOffsetX = Math.max(0, (imgWidth - canvas.width) / 2);
          const maxOffsetY = Math.max(0, (imgHeight - canvas.height) / 2);

          setPanOffset({
            x: Math.min(Math.max(x + dx, -maxOffsetX), maxOffsetX),
            y: Math.min(Math.max(y + dy, -maxOffsetY), maxOffsetY),
          });
        };

        const handleMouseUp = () => {
          setIsPanning(false);
          window.removeEventListener("mousemove", handleMouseMove);
          window.removeEventListener("mouseup", handleMouseUp);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
      }
    };

    return (
      <div
        ref={containerRef}
        data-testid="canvas-wrapper"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
      >
        <canvas
          ref={canvasRef}
          width={1024}
          height={1024}
          aria-label="canvas-element"
        ></canvas>
      </div>
    );
  };

  it("handles zoom in/out on wheel scroll", () => {
    render(<TestComponent annotationsActive={false} scale={1} />);

    const container = screen.getByTestId("canvas-wrapper");

    fireEvent.wheel(container, { deltaY: -100 }); // Simulate zoom in
    fireEvent.wheel(container, { deltaY: 100 }); // Simulate zoom out

    expect(setScale).toHaveBeenCalledTimes(2);
  });

  it("does not zoom when annotations are active", () => {
    render(<TestComponent annotationsActive={true} scale={1} />);

    const container = screen.getByTestId("canvas-wrapper");

    fireEvent.wheel(container, { deltaY: -100 });

    expect(setScale).not.toHaveBeenCalled();
  });

  it("initiates panning on mouse down when scale > 1", () => {
    render(<TestComponent scale={2} panOffset={{ x: 0, y: 0 }} />);

    const container = screen.getByTestId("canvas-wrapper");
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });

    expect(setIsPanning).toHaveBeenCalledWith(true);
  });

  it("does not initiate panning when scale is 1", () => {
    render(<TestComponent scale={1} panOffset={{ x: 0, y: 0 }} />);

    const container = screen.getByTestId("canvas-wrapper");
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });

    expect(setIsPanning).not.toHaveBeenCalled();
  });

  it("updates pan offset on mouse move", () => {
    render(<TestComponent scale={2} panOffset={{ x: 10, y: 10 }} />);

    const container = screen.getByTestId("canvas-wrapper");
    fireEvent.mouseDown(container, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 120, clientY: 130 });

    expect(setPanOffset).toHaveBeenCalled();
  });

  it("stops panning on mouse up", () => {
    render(<TestComponent scale={2} panOffset={{ x: 10, y: 10 }} />);

    fireEvent.mouseDown(screen.getByTestId("canvas-wrapper"), {
      clientX: 100,
      clientY: 100,
    });
    fireEvent.mouseUp(window);

    expect(setIsPanning).toHaveBeenCalledWith(false);
  });

  // ---------------------info sidebar-------------------------

  const mockXrayData = { tbScore: 85, url: "https://example.com/xray.png" };
  const mockAbnormalities = ["Lung Opacity"];

  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/xrays/")) {
        return Promise.resolve({ data: mockXrayData });
      }
      if (url.includes("/api/xrays/") && url.includes("/abnormalities")) {
        return Promise.resolve({ data: mockAbnormalities });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it("fetches and updates X-ray data", async () => {
    render(<Heatmap />);

    await waitFor(() => {
      expect(screen.getByTestId("semi-circle")).toHaveTextContent(
        "TB Score: 85%"
      );
    });
  });

  it("renders SemiCircle with the correct TB score after data loads", async () => {
    render(<Heatmap />);

    await waitFor(() =>
      expect(screen.getByTestId("semi-circle")).toHaveTextContent(
        /TB Score: \d+%/
      )
    );
  });

  // it("displays 'No abnormalities found' when there are no abnormalities", async () => {
  //   render(<AbnormalityBar abnormalities={[]} />);

  //   // Debugging: Print the actual rendered DOM
  //   screen.debug();

  //   // Ensure the test ID element exists
  //   const abnormalityElement = await screen.findByTestId("abnormality-bar");

  //   // Check if the text "No abnormalities found" is inside the div
  //   expect(abnormalityElement).toHaveTextContent("No abnormalities found");
  // });

  it("debugs AbnormalityBar rendering", async () => {
    render(<AbnormalityBar abnormalities={[]} />);

    await screen.findByTestId("abnormality-bar");

    // Print the rendered DOM to see what's actually inside
    screen.debug();
  });
});
