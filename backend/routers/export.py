from fastapi import APIRouter, HTTPException, Query, Response
from backend.services.edl_exporter import EdlExporter

router = APIRouter(prefix="/api/v1/scenes", tags=["NLE Export"])

@router.get("/{scene_id}/export-edl")
def export_scene_edl(
    scene_id: str,
    format: str = Query(default="otio", pattern="^(otio|fcpxml)$"),
    proposed_change: str = Query(default="MOVE REVEAL 6S EARLIER")
):
    """
    Exports an approved AI edit proposal as an OpenTimelineIO (.otio) or Final Cut Pro XML (.fcpxml) file.
    """
    if format == "fcpxml":
        content = EdlExporter.export_fcpxml(scene_id, proposed_change)
        return Response(
            content=content,
            media_type="application/xml",
            headers={"Content-Disposition": f"attachment; filename=MomentLab_{scene_id}.fcpxml"}
        )
    
    content = EdlExporter.export_otio(scene_id, proposed_change)
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=MomentLab_{scene_id}.otio"}
    )
