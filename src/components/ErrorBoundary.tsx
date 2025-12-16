import React, { Component, ReactNode } from "react";
import { Box, Flex, Text, Button, Callout } from "@radix-ui/themes";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches React errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box p="4">
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>
              <Flex direction="column" gap="3">
                <Text weight="bold">Something went wrong</Text>
                <Text size="2">
                  {this.state.error?.message || "An unexpected error occurred"}
                </Text>
                {import.meta.env.DEV && this.state.errorInfo && (
                  <Box
                    style={{
                      padding: "8px",
                      background: "var(--gray-a2)",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                      maxHeight: "200px",
                      overflow: "auto",
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Box>
                )}
                <Button size="2" onClick={this.handleReset}>
                  Try Again
                </Button>
              </Flex>
            </Callout.Text>
          </Callout.Root>
        </Box>
      );
    }

    return this.props.children;
  }
}
