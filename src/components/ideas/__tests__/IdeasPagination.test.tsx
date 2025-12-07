import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IdeasPagination } from "../IdeasPagination";
import type { PaginationMetaDTO } from "@/types";

const basePagination: PaginationMetaDTO = {
  page: 2,
  limit: 10,
  total: 30,
  total_pages: 3,
};

describe("IdeasPagination", () => {
  it("should not render when only one page is available", () => {
    const { container } = render(
      <IdeasPagination pagination={{ ...basePagination, page: 1, total_pages: 1 }} onPageChange={vi.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render current page info and navigation buttons", () => {
    render(<IdeasPagination pagination={{ ...basePagination, page: 2, total_pages: 5 }} onPageChange={vi.fn()} />);

    expect(screen.getByText("Strona 2 z 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Poprzednia/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Następna/ })).toBeInTheDocument();
  });

  it("should disable previous button on the first page", async () => {
    render(<IdeasPagination pagination={{ ...basePagination, page: 1 }} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Poprzednia/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Następna/ })).toBeEnabled();
  });

  it("should disable next button on the last page", () => {
    render(
      <IdeasPagination pagination={{ ...basePagination, page: basePagination.total_pages }} onPageChange={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: /Poprzednia/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Następna/ })).toBeDisabled();
  });

  it("should call onPageChange for button clicks", async () => {
    const onPageChange = vi.fn();
    render(<IdeasPagination pagination={{ ...basePagination, page: 2, total_pages: 4 }} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole("button", { name: /Poprzednia/ }));
    await userEvent.click(screen.getByRole("button", { name: /Następna/ }));

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("should handle arrow key navigation when no input is focused", () => {
    const onPageChange = vi.fn();
    render(<IdeasPagination pagination={{ ...basePagination, page: 2 }} onPageChange={onPageChange} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("should ignore arrow keys when an input is focused", () => {
    const onPageChange = vi.fn();
    render(<IdeasPagination pagination={basePagination} onPageChange={onPageChange} />);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(onPageChange).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });
});
