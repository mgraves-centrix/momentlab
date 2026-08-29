import pytest
from backend.services.clickhouse import check_connection

def test_clickhouse_connection_sanitization():
    # Health check should not expose sensitive secrets
    health = check_connection(timeout=2)
    assert "password" not in str(health).lower() or "******" in str(health)
    assert health["host"] is not None


@pytest.mark.anyio
async def test_mcp_agent_fails_when_user_unset(monkeypatch):
    from backend.agents.mcp_client import generate_hypothesis
    monkeypatch.delenv("CLICKHOUSE_MCP_USER", raising=False)
    monkeypatch.setenv("CLICKHOUSE_USER", "default")
    with pytest.raises(ValueError, match="CLICKHOUSE_MCP_USER"):
        await generate_hypothesis("proj_northlight_01", "exp_23a")

@pytest.mark.anyio
async def test_mcp_agent_fails_when_password_unset(monkeypatch):
    from backend.agents.mcp_client import generate_hypothesis
    monkeypatch.setenv("CLICKHOUSE_MCP_USER", "momentlab_mcp_reader")
    monkeypatch.delenv("CLICKHOUSE_MCP_PASSWORD", raising=False)
    monkeypatch.setenv("CLICKHOUSE_PASSWORD", "some_default_pass")
    with pytest.raises(ValueError, match="CLICKHOUSE_MCP_PASSWORD"):
        await generate_hypothesis("proj_northlight_01", "exp_23a")
