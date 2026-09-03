import os
import shutil
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

def test_mcp_unapproved_tool_rejection_unit():
    """Unit test for MCP tool allowlist invariant without spawning subprocesses."""
    from backend.agents.mcp_client import ALLOWED_MCP_TOOLS
    from google.adk.tools.mcp_tool.mcp_toolset import McpToolset, StdioConnectionParams
    from mcp.client.stdio import StdioServerParameters
    
    assert "run_query" in ALLOWED_MCP_TOOLS
    assert "list_tables" in ALLOWED_MCP_TOOLS
    assert "list_databases" not in ALLOWED_MCP_TOOLS
    assert "unapproved_system_exec" not in ALLOWED_MCP_TOOLS
    assert "drop_database" not in ALLOWED_MCP_TOOLS

    toolset = McpToolset(
        tool_name_prefix="clickhouse",
        tool_filter=ALLOWED_MCP_TOOLS,
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(command="uvx", args=["mcp-clickhouse"])
        )
    )
    assert toolset.tool_filter == ALLOWED_MCP_TOOLS


@pytest.mark.integration
@pytest.mark.anyio
@pytest.mark.skipif(
    not shutil.which("uvx") or not os.environ.get("CLICKHOUSE_MCP_USER") or not os.environ.get("CLICKHOUSE_MCP_PASSWORD"),
    reason="Requires uvx and CLICKHOUSE_MCP_* environment variables for live subprocess testing"
)
async def test_mcp_unapproved_tool_rejection_integration():
    """Integration test verifying real subprocess tool filtering when environment is present."""
    from backend.agents.mcp_client import ALLOWED_MCP_TOOLS
    from google.adk.tools.mcp_tool.mcp_toolset import McpToolset, StdioConnectionParams
    from mcp.client.stdio import StdioServerParameters

    toolset = McpToolset(
        tool_name_prefix="clickhouse",
        tool_filter=ALLOWED_MCP_TOOLS,
        connection_params=StdioConnectionParams(
            server_params=StdioServerParameters(
                command="uvx",
                args=["mcp-clickhouse"],
                env={
                    "CLICKHOUSE_HOST": os.environ.get("CLICKHOUSE_HOST", "localhost"),
                    "CLICKHOUSE_PORT": os.environ.get("CLICKHOUSE_PORT", "8443"),
                    "CLICKHOUSE_USER": os.environ.get("CLICKHOUSE_MCP_USER", ""),
                    "CLICKHOUSE_PASSWORD": os.environ.get("CLICKHOUSE_MCP_PASSWORD", ""),
                    "CLICKHOUSE_SECURE": os.environ.get("CLICKHOUSE_SECURE", "true"),
                    "CLICKHOUSE_DATABASE": os.environ.get("CLICKHOUSE_DATABASE", "momentlab"),
                    "PATH": os.environ.get("PATH", "")
                }
            )
        )
    )
    tools = await toolset.get_tools()
    tool_names = [t.name for t in tools]
    
    for allowed in ALLOWED_MCP_TOOLS:
        assert allowed in tool_names
    assert "list_databases" not in tool_names
    assert "unapproved_system_exec" not in tool_names
    assert "drop_database" not in tool_names
