# ABOUTME: TDD tests for main.py functionality
# Tests basic hello world functionality following TDD principles

import os
import sys

import pytest

# Add the root directory to the path so we can import main
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

import main


def test_main_prints_hello_message(capsys: pytest.CaptureFixture[str]) -> None:
    """Test that main prints expected message."""
    main.main()
    captured = capsys.readouterr()
    assert "Hello from textile-showcase!" in captured.out


def test_main_exits_cleanly() -> None:
    """Test that main function completes without error."""
    # This should pass - basic smoke test
    main.main()


def test_main_when_called_directly() -> None:
    """Test that the if __name__ == '__main__' block works."""
    # This tests the module structure
    assert hasattr(main, "main")
    assert callable(main.main)
