import { render, screen } from "@testing-library/react";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders label", () => {
    render(<Button>Deploy</Button>);
    expect(screen.getByRole("button", { name: /deploy/i })).toBeInTheDocument();
  });
});
