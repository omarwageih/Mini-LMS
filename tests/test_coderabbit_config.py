"""
Tests for .coderabbit.yaml configuration file.

These tests validate the structure and content introduced in the PR that added:
- tone_instructions: senior engineer/security reviewer persona
- path_instructions: structured 7-point review checklist for all files
"""
import os
import pytest
import yaml

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG_PATH = os.path.join(REPO_ROOT, ".coderabbit.yaml")


@pytest.fixture(scope="module")
def config():
    """Load and parse .coderabbit.yaml once for all tests."""
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        return yaml.safe_load(fh)


# ---------------------------------------------------------------------------
# Basic file validity
# ---------------------------------------------------------------------------

class TestFileValidity:
    def test_file_exists(self):
        assert os.path.isfile(CONFIG_PATH), ".coderabbit.yaml must exist at repo root"

    def test_file_is_valid_yaml(self):
        with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
            content = yaml.safe_load(fh)
        assert content is not None, "YAML file must not be empty or null"

    def test_file_is_non_empty(self):
        assert os.path.getsize(CONFIG_PATH) > 0, ".coderabbit.yaml must not be empty"


# ---------------------------------------------------------------------------
# Top-level keys
# ---------------------------------------------------------------------------

class TestTopLevelKeys:
    def test_language_key_present(self, config):
        assert "language" in config

    def test_language_is_en_us(self, config):
        assert config["language"] == "en-US"

    def test_reviews_key_present(self, config):
        assert "reviews" in config, "Top-level 'reviews' key must be present"

    def test_chat_key_present(self, config):
        assert "chat" in config, "Top-level 'chat' key must be present"

    def test_chat_enabled(self, config):
        assert config["chat"]["enabled"] is True


# ---------------------------------------------------------------------------
# reviews section (pre-existing fields)
# ---------------------------------------------------------------------------

class TestReviewsSection:
    def test_auto_review_enabled(self, config):
        assert config["reviews"]["auto_review"]["enabled"] is True

    def test_auto_review_drafts_false(self, config):
        assert config["reviews"]["auto_review"]["drafts"] is False

    def test_profile_key_present(self, config):
        assert "profile" in config["reviews"]


# ---------------------------------------------------------------------------
# tone_instructions (NEW in this PR)
# ---------------------------------------------------------------------------

class TestToneInstructions:
    def test_tone_instructions_key_present(self, config):
        assert "tone_instructions" in config["reviews"], (
            "tone_instructions must be present under reviews"
        )

    def test_tone_instructions_is_string(self, config):
        assert isinstance(config["reviews"]["tone_instructions"], str)

    def test_tone_instructions_is_not_empty(self, config):
        assert config["reviews"]["tone_instructions"].strip() != ""

    def test_tone_mentions_senior_engineer(self, config):
        tone = config["reviews"]["tone_instructions"].lower()
        assert "senior" in tone and "engineer" in tone, (
            "tone_instructions must reference a senior engineer persona"
        )

    def test_tone_mentions_security_reviewer(self, config):
        tone = config["reviews"]["tone_instructions"].lower()
        assert "security" in tone and "reviewer" in tone, (
            "tone_instructions must reference a security reviewer role"
        )

    def test_tone_mentions_lms(self, config):
        tone = config["reviews"]["tone_instructions"].lower()
        assert "lms" in tone, (
            "tone_instructions must reference the LMS system context"
        )

    def test_tone_mentions_production(self, config):
        tone = config["reviews"]["tone_instructions"].lower()
        assert "production" in tone, (
            "tone_instructions must emphasize production-grade review"
        )

    def test_tone_distinguishes_from_student_project(self, config):
        """Regression: the persona must reject treating the codebase as a student project."""
        tone = config["reviews"]["tone_instructions"].lower()
        assert "student project" in tone, (
            "tone_instructions should explicitly mention (and reject) treating the repo as a student project"
        )

    def test_tone_asks_for_deep_technical_review(self, config):
        tone = config["reviews"]["tone_instructions"].lower()
        assert "deep technical" in tone or "technical review" in tone, (
            "tone_instructions must request deep technical review"
        )


# ---------------------------------------------------------------------------
# path_instructions (NEW in this PR)
# ---------------------------------------------------------------------------

class TestPathInstructions:
    def test_path_instructions_key_present(self, config):
        assert "path_instructions" in config["reviews"], (
            "path_instructions must be present under reviews"
        )

    def test_path_instructions_is_list(self, config):
        assert isinstance(config["reviews"]["path_instructions"], list), (
            "path_instructions must be a YAML sequence"
        )

    def test_path_instructions_is_non_empty(self, config):
        assert len(config["reviews"]["path_instructions"]) > 0, (
            "path_instructions must contain at least one entry"
        )

    def test_first_entry_has_path_key(self, config):
        entry = config["reviews"]["path_instructions"][0]
        assert "path" in entry, "Each path_instructions entry must have a 'path' key"

    def test_first_entry_glob_matches_all_files(self, config):
        entry = config["reviews"]["path_instructions"][0]
        assert entry["path"] == "**/*", (
            "The catch-all path_instructions entry must use '**/*' to match all files"
        )

    def test_first_entry_has_instructions_key(self, config):
        entry = config["reviews"]["path_instructions"][0]
        assert "instructions" in entry, (
            "Each path_instructions entry must have an 'instructions' key"
        )

    def test_instructions_is_string(self, config):
        instructions = config["reviews"]["path_instructions"][0]["instructions"]
        assert isinstance(instructions, str)

    def test_instructions_is_non_empty(self, config):
        instructions = config["reviews"]["path_instructions"][0]["instructions"]
        assert instructions.strip() != ""


# ---------------------------------------------------------------------------
# path_instructions content – all 7 review categories (NEW in this PR)
# ---------------------------------------------------------------------------

class TestPathInstructionsContent:
    """Verify each of the 7 structured review tasks is present in the instructions."""

    @pytest.fixture(autouse=True)
    def instructions_lower(self, config):
        raw = config["reviews"]["path_instructions"][0]["instructions"]
        self._instructions = raw
        self._lower = raw.lower()

    def test_architecture_review_present(self):
        assert "architecture" in self._lower, (
            "Instructions must include an Architecture Review task"
        )

    def test_authentication_security_audit_present(self):
        assert "authentication" in self._lower and "security" in self._lower, (
            "Instructions must include an Authentication & Security Audit task"
        )

    def test_password_handling_mentioned(self):
        """Regression: security audit must call out password handling specifics."""
        assert "bcrypt" in self._lower or "sha256" in self._lower or "password" in self._lower, (
            "Security audit must mention password handling (bcrypt, SHA256, or plaintext)"
        )

    def test_jwt_mentioned(self):
        assert "jwt" in self._lower, (
            "Security audit must mention JWT implementation review"
        )

    def test_code_quality_present(self):
        assert "code quality" in self._lower, (
            "Instructions must include a Code Quality review task"
        )

    def test_database_design_review_present(self):
        assert "database" in self._lower and "design" in self._lower, (
            "Instructions must include a Database Design Review task"
        )

    def test_performance_scalability_present(self):
        assert "performance" in self._lower and "scalability" in self._lower, (
            "Instructions must include a Performance & Scalability review task"
        )

    def test_missing_production_features_present(self):
        assert "missing" in self._lower and "production" in self._lower, (
            "Instructions must list Missing Production Features"
        )

    def test_prioritized_improvements_present(self):
        assert "prioritized" in self._lower or "top 5" in self._lower, (
            "Instructions must include a PRIORITIZED Improvements section"
        )

    def test_seven_numbered_tasks_present(self):
        """All 7 tasks should appear as numbered items."""
        for i in range(1, 8):
            assert f"{i}." in self._instructions, (
                f"Task {i} (numbered item '{i}.') is missing from instructions"
            )

    def test_anti_generic_advice_directive_present(self):
        """The instructions must explicitly ban generic advice."""
        assert "do not give generic advice" in self._lower or "not give generic" in self._lower, (
            "Instructions must contain the 'Do NOT give generic advice' directive"
        )

    def test_instructions_request_code_snippets(self):
        assert "code snippet" in self._lower or "code examples" in self._lower, (
            "Instructions must request code snippets or examples in feedback"
        )

    def test_rate_limiting_mentioned(self):
        """Regression: security audit must call out rate limiting as a concern."""
        assert "rate limiting" in self._lower or "rate-limiting" in self._lower or "brute force" in self._lower, (
            "Security audit must mention rate limiting or brute force protection"
        )