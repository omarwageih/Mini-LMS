"""
Tests for README.md content.

These tests validate the change introduced in this PR:
- Added the CodeRabbit badge line:
  [![CodeRabbit](https://img.shields.io/badge/CodeRabbit-Reviewed-success?logo=robot)](https://coderabbit.ai)
"""
import os
import re
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
README_PATH = os.path.join(REPO_ROOT, "README.md")

CODERABBIT_BADGE_PATTERN = re.compile(
    r'\[!\[CodeRabbit\]\(https://img\.shields\.io/badge/CodeRabbit[^)]*\)\]\(https://coderabbit\.ai\)'
)


@pytest.fixture(scope="module")
def readme_content():
    """Read README.md once for all tests."""
    with open(README_PATH, "r", encoding="utf-8") as fh:
        return fh.read()


@pytest.fixture(scope="module")
def readme_lines(readme_content):
    return readme_content.splitlines()


# ---------------------------------------------------------------------------
# Basic file validity
# ---------------------------------------------------------------------------

class TestFileValidity:
    def test_file_exists(self):
        assert os.path.isfile(README_PATH), "README.md must exist at repo root"

    def test_file_is_non_empty(self, readme_content):
        assert len(readme_content.strip()) > 0, "README.md must not be empty"


# ---------------------------------------------------------------------------
# CodeRabbit badge (NEW in this PR)
# ---------------------------------------------------------------------------

class TestCodeRabbitBadge:
    def test_coderabbit_badge_line_present(self, readme_content):
        """The CodeRabbit badge markdown must appear somewhere in the README."""
        assert "CodeRabbit" in readme_content, (
            "README.md must contain the CodeRabbit badge"
        )

    def test_coderabbit_badge_is_clickable_link(self, readme_content):
        """Badge must be wrapped in a hyperlink pointing to coderabbit.ai."""
        assert "https://coderabbit.ai" in readme_content, (
            "CodeRabbit badge must link to https://coderabbit.ai"
        )

    def test_coderabbit_badge_uses_shields_io(self, readme_content):
        """Badge image must use shields.io."""
        assert "img.shields.io/badge/CodeRabbit" in readme_content, (
            "CodeRabbit badge image must be sourced from shields.io"
        )

    def test_coderabbit_badge_label_is_reviewed(self, readme_content):
        """Badge text must say 'Reviewed'."""
        assert "CodeRabbit-Reviewed" in readme_content, (
            "CodeRabbit badge must carry the 'Reviewed' label"
        )

    def test_coderabbit_badge_color_is_success(self, readme_content):
        """Badge colour must convey a positive/success state."""
        assert "success" in readme_content, (
            "CodeRabbit badge must use 'success' colour to indicate a passing review"
        )

    def test_coderabbit_badge_has_robot_logo(self, readme_content):
        """Badge must include the robot logo parameter."""
        assert "logo=robot" in readme_content, (
            "CodeRabbit badge must include logo=robot"
        )

    def test_coderabbit_badge_full_markdown_format(self, readme_content):
        """Badge must match the exact markdown image-link pattern."""
        assert CODERABBIT_BADGE_PATTERN.search(readme_content), (
            "CodeRabbit badge must match the pattern "
            "[![CodeRabbit](<shields-url>)](<coderabbit-url>)"
        )

    def test_coderabbit_badge_in_badges_section(self, readme_lines):
        """Badge must appear near the top of the file, before the first '---' separator."""
        first_separator_idx = next(
            (i for i, line in enumerate(readme_lines) if line.strip() == "---"),
            None,
        )
        badge_idx = next(
            (i for i, line in enumerate(readme_lines) if "CodeRabbit" in line),
            None,
        )
        assert badge_idx is not None, "CodeRabbit badge line must exist"
        if first_separator_idx is not None:
            assert badge_idx < first_separator_idx, (
                "CodeRabbit badge must appear in the badges section, before the first '---'"
            )

    def test_coderabbit_badge_on_its_own_line(self, readme_lines):
        """Badge must occupy its own line (not embedded mid-paragraph)."""
        badge_lines = [line for line in readme_lines if "CodeRabbit" in line and "shields.io" in line]
        assert len(badge_lines) >= 1, "CodeRabbit badge must appear on at least one dedicated line"
        for line in badge_lines:
            stripped = line.strip()
            # The badge line should start with the markdown image-link syntax
            assert stripped.startswith("[!["), (
                f"Badge line must start with '[!['  — got: {stripped!r}"
            )


# ---------------------------------------------------------------------------
# Regression: pre-existing badges must still be present
# ---------------------------------------------------------------------------

class TestExistingBadgesUnchanged:
    """Ensure the new badge didn't accidentally remove any pre-existing badges."""

    def test_nodejs_badge_still_present(self, readme_content):
        assert "Node.js" in readme_content, "Node.js badge must still be present"

    def test_react_badge_still_present(self, readme_content):
        assert "React" in readme_content, "React badge must still be present"

    def test_sql_server_badge_still_present(self, readme_content):
        assert "SQL_Server" in readme_content or "SQL Server" in readme_content, (
            "SQL Server badge must still be present"
        )

    def test_tailwind_badge_still_present(self, readme_content):
        assert "Tailwind" in readme_content, "Tailwind CSS badge must still be present"

    def test_four_or_more_badges_present(self, readme_content):
        """After adding the CodeRabbit badge there should be at least 5 badges total."""
        badge_count = readme_content.count("shields.io/badge/")
        assert badge_count >= 5, (
            f"Expected at least 5 badges (4 existing + CodeRabbit), found {badge_count}"
        )


# ---------------------------------------------------------------------------
# README structural integrity
# ---------------------------------------------------------------------------

class TestReadmeStructure:
    def test_title_present(self, readme_content):
        assert "MUST University LMS" in readme_content or "LMS" in readme_content, (
            "README.md must contain the project title"
        )

    def test_sections_still_present(self, readme_content):
        """Key sections introduced before this PR must survive the badge addition."""
        for section in ("Features", "Tech Stack", "Getting Started", "API Endpoints"):
            assert section in readme_content, (
                f"README.md section '{section}' must still be present"
            )

    def test_no_duplicate_coderabbit_badges(self, readme_content):
        """Boundary/negative: the badge must appear exactly once."""
        occurrences = len(re.findall(r"CodeRabbit-Reviewed", readme_content))
        assert occurrences == 1, (
            f"CodeRabbit badge should appear exactly once, found {occurrences}"
        )