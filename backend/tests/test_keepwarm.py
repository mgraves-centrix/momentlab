import pytest
import anyio
from unittest.mock import patch
from backend.main import KEEPWARM_INTERVAL_SECONDS, _clickhouse_keepwarm_loop

def test_keepwarm_constant():
    assert KEEPWARM_INTERVAL_SECONDS == 240

@pytest.mark.anyio
async def test_keepwarm_loop_state_change_logging():
    with patch("backend.main.check_connection") as mock_check, \
         patch("backend.main.asyncio.sleep") as mock_sleep, \
         patch("backend.main.root_logger") as mock_logger:
        
        mock_check.side_effect = [
            {"connected": True, "host": "localhost", "version": "sqlite-adapter"},
            {"connected": True, "host": "localhost", "version": "sqlite-adapter"},
            {"connected": False, "host": "localhost", "version": None, "error": "Connection timeout"},
            Exception("Network unreachable"),
        ]
        
        mock_sleep.side_effect = [None, None, None, anyio.get_cancelled_exc_class()()]

        try:
            await _clickhouse_keepwarm_loop()
        except anyio.get_cancelled_exc_class():
            pass

        assert mock_check.call_count == 4
        mock_logger.info.assert_any_call("ClickHouse keep-warm initial status: connected=%s", True)
        mock_logger.info.assert_any_call("ClickHouse keep-warm state changed: connected=%s -> connected=%s", True, False)
