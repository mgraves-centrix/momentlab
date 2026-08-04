import json
from typing import Dict, Any

class EdlExporter:
    """
    Exports approved AI edit proposals as OpenTimelineIO (.otio) or Final Cut Pro XML (.fcpxml) files
    for direct import into Adobe Premiere Pro, DaVinci Resolve, or Final Cut Pro.
    """
    @staticmethod
    def export_otio(scene_id: str, proposed_change: str, offset_seconds: float = -6.0) -> str:
        otio_structure = {
            "OTIO_SCHEMA": "Timeline.1",
            "metadata": {
                "momentlab": {
                    "scene_id": scene_id,
                    "proposed_change": proposed_change,
                    "generated_by": "MomentLab Gemini ADK Agent"
                }
            },
            "name": f"MomentLab_Edit_{scene_id}",
            "tracks": {
                "OTIO_SCHEMA": "Stack.1",
                "children": [
                    {
                        "OTIO_SCHEMA": "Track.1",
                        "kind": "Video",
                        "name": "V1",
                        "children": [
                            {
                                "OTIO_SCHEMA": "Clip.1",
                                "name": f"Scene_{scene_id}_CutA",
                                "source_range": {
                                    "OTIO_SCHEMA": "TimeRange.1",
                                    "start_time": {"OTIO_SCHEMA": "RationalTime.1", "rate": 24, "value": 0},
                                    "duration": {"OTIO_SCHEMA": "RationalTime.1", "rate": 24, "value": 888} # 37 seconds at 24fps
                                }
                            },
                            {
                                "OTIO_SCHEMA": "Clip.1",
                                "name": f"Scene_{scene_id}_ShiftedReveal",
                                "source_range": {
                                    "OTIO_SCHEMA": "TimeRange.1",
                                    "start_time": {"OTIO_SCHEMA": "RationalTime.1", "rate": 24, "value": 888},
                                    "duration": {"OTIO_SCHEMA": "RationalTime.1", "rate": 24, "value": 552} # 23 seconds
                                }
                            }
                        ]
                    }
                ]
            }
        }
        return json.dumps(otio_structure, indent=2)

    @staticmethod
    def export_fcpxml(scene_id: str, proposed_change: str) -> str:
        return f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
    <resources>
        <format id="r1" name="FFVideoFormat1080p24" frameDuration="100/2400s" width="1920" height="1080"/>
        <asset id="r2" name="scene_{scene_id}" src="file:///media/scene_{scene_id}.mp4" start="0s" duration="60s" hasVideo="1"/>
    </resources>
    <library>
        <event name="MomentLab AI Edits">
            <project name="MomentLab_Edit_{scene_id}">
                <sequence format="r1" duration="60s">
                    <spine>
                        <asset-clip name="Cut_A" ref="r2" offset="0s" start="0s" duration="37s"/>
                        <!-- MomentLab Edit: {proposed_change} -->
                        <asset-clip name="Shifted_Reveal" ref="r2" offset="37s" start="43s" duration="17s"/>
                    </spine>
                </sequence>
            </project>
        </event>
    </library>
</fcpxml>"""
