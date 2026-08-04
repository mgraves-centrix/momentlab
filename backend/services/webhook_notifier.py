import os
import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger("momentlab.webhooks")

class WebhookNotifier:
    """
    Dispatches real-time alerts to Slack / Microsoft Teams / custom webhooks
    when critical response cliffs are detected or A/B tests reach significance.
    """
    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url or os.getenv("SLACK_WEBHOOK_URL")

    async def notify_anomaly_detected(self, project_name: str, scene_id: str, timecode: str, drop_pct: float):
        payload = {
            "text": f"🚨 *MomentLab Alert*: Response cliff detected in *{project_name}* ({scene_id}) at timecode `{timecode}`!\nRetention dropped by *{drop_pct:.1f}%*.",
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"🚨 *Audience Friction Alert*\n*Project*: {project_name}\n*Scene*: {scene_id}\n*Timecode*: `{timecode}`\n*Retention Drop*: `{drop_pct:.1f}%`"
                    }
                }
            ]
        }
        await self._send(payload)

    async def notify_experiment_complete(self, experiment_id: str, winning_variant: str, lift_pct: str):
        payload = {
            "text": f"🎉 *MomentLab A/B Test Complete*: Experiment `{experiment_id}` concluded with *{winning_variant}* outperforming Control by *{lift_pct}*!"
        }
        await self._send(payload)

    async def _send(self, payload: Dict[str, Any]):
        if not self.webhook_url:
            logger.info("Webhook URL not configured. Payload logged locally: %s", payload.get("text"))
            return
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(self.webhook_url, json=payload, timeout=5.0)
                resp.raise_for_status()
                logger.info("Webhook alert dispatched successfully.")
        except Exception as err:
            logger.warning("Failed to dispatch webhook alert: %s", err)
