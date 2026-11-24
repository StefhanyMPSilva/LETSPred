from pydantic import BaseModel

class PipelineRequest(BaseModel):
    actives_dw_path: str
    decoys_dw_path: str
    actives_cons_path: str
    decoys_cons_path: str
    output_prefix: str

class PipelineResponse(BaseModel):
    run_id: str
    status: str
    output_dir: str