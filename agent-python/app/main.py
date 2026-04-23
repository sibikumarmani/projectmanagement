from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MAX_TOOL_ROUNDS = 10
SYSTEM_PROMPT = """
You are a data-entry agent for an enterprise Project Management System.

Your job is to create PMS records by using the provided tools.

Rules:
- Use tools whenever the user is asking to create, prepare, register, add, log, or seed PMS data.
- Never invent numeric IDs. If you need an existing project, WBS, activity, milestone, or user, first call a listing tool.
- Create only the records the user asked for.
- If required information is missing, stop and ask a concise follow-up question instead of guessing.
- Keep passwords explicit only when the user provided one. If the user did not provide a password for a new user, ask for it.
- After tool execution, summarize exactly what was created and mention any remaining gaps.
- Prefer creating linked records in the correct order: project, then WBS, then milestone/activity, then downstream records.
""".strip()


class AgentChatMessage(BaseModel):
    role: str
    content: str


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[AgentChatMessage] | None = None


class AgentActionResult(BaseModel):
    toolName: str
    success: bool
    summary: str


class AgentChatResponse(BaseModel):
    message: str
    model: str
    actions: list[AgentActionResult]


app = FastAPI(title="PMS Python Agent")


def openrouter_api_key() -> str:
    value = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not value:
        raise HTTPException(status_code=503, detail="OPENROUTER_API_KEY is not configured for the chatbot agent")
    return value


def openrouter_model() -> str:
    return os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-120b").strip() or "openai/gpt-oss-120b"


def backend_api_base_url() -> str:
    return os.getenv("BACKEND_API_BASE_URL", "http://backend:8080/api").rstrip("/")


def build_messages(request: AgentChatRequest) -> list[dict[str, Any]]:
    messages: list[dict[str, Any]] = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in request.history or []:
        role = item.role.strip().lower()
        if role not in {"system", "user", "assistant"}:
            role = "user"
        if item.content.strip():
            messages.append({"role": role, "content": item.content.strip()})
    messages.append({"role": "user", "content": request.message.strip()})
    return messages


def tool_definitions() -> list[dict[str, Any]]:
    def schema(properties: dict[str, Any], required: list[str]) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": properties,
            "required": required,
            "additionalProperties": False,
        }

    def function_tool(name: str, description: str, parameters: dict[str, Any]) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": name,
                "description": description,
                "parameters": parameters,
            },
        }

    return [
        function_tool("list_projects", "List projects so you can resolve a project by code or name.", schema({}, [])),
        function_tool("list_users", "List users so you can resolve employees or responsible users.", schema({}, [])),
        function_tool(
            "list_wbs",
            "List WBS items for a project.",
            schema({"projectId": {"type": "integer", "description": "Project ID to inspect"}}, ["projectId"]),
        ),
        function_tool(
            "list_activities",
            "List activities for a project.",
            schema({"projectId": {"type": "integer", "description": "Project ID to inspect"}}, ["projectId"]),
        ),
        function_tool(
            "list_milestones",
            "List milestones for a project.",
            schema({"projectId": {"type": "integer", "description": "Project ID to inspect"}}, ["projectId"]),
        ),
        function_tool(
            "create_project",
            "Create a new project.",
            schema(
                {
                    "projectCode": {"type": "string"},
                    "projectName": {"type": "string"},
                    "clientName": {"type": "string"},
                    "projectManager": {"type": "string"},
                    "startDate": {"type": "string"},
                    "endDate": {"type": "string"},
                    "budgetAmount": {"type": "number"},
                },
                ["projectCode", "projectName", "clientName", "projectManager", "startDate", "endDate", "budgetAmount"],
            ),
        ),
        function_tool(
            "create_user",
            "Create a new user.",
            schema(
                {
                    "fullName": {"type": "string"},
                    "email": {"type": "string"},
                    "password": {"type": "string"},
                    "roleName": {"type": "string"},
                    "active": {"type": "boolean"},
                    "emailVerified": {"type": "boolean"},
                },
                ["fullName", "email", "password", "roleName", "active", "emailVerified"],
            ),
        ),
        function_tool(
            "create_wbs",
            "Create a WBS item under a project.",
            schema(
                {
                    "projectId": {"type": "integer"},
                    "wbsCode": {"type": "string"},
                    "wbsName": {"type": "string"},
                    "levelNo": {"type": "integer"},
                    "progressPercent": {"type": "integer"},
                    "budgetAmount": {"type": "number"},
                    "actualAmount": {"type": "number"},
                },
                ["projectId", "wbsCode", "wbsName", "levelNo", "progressPercent", "budgetAmount", "actualAmount"],
            ),
        ),
        function_tool(
            "create_activity",
            "Create an activity under a project and WBS.",
            schema(
                {
                    "projectId": {"type": "integer"},
                    "wbsId": {"type": "integer"},
                    "activityCode": {"type": "string"},
                    "activityName": {"type": "string"},
                    "plannedStart": {"type": "string"},
                    "plannedEnd": {"type": "string"},
                    "durationDays": {"type": "integer"},
                    "progressPercent": {"type": "integer"},
                    "status": {"type": "string"},
                    "responsibleUser": {"type": "string"},
                },
                [
                    "projectId",
                    "wbsId",
                    "activityCode",
                    "activityName",
                    "plannedStart",
                    "plannedEnd",
                    "durationDays",
                    "progressPercent",
                    "status",
                    "responsibleUser",
                ],
            ),
        ),
        function_tool(
            "create_milestone",
            "Create a milestone under a project.",
            schema(
                {
                    "projectId": {"type": "integer"},
                    "milestoneCode": {"type": "string"},
                    "milestoneName": {"type": "string"},
                    "wbsId": {"type": ["integer", "null"]},
                    "plannedDate": {"type": "string"},
                    "actualDate": {"type": ["string", "null"]},
                    "status": {"type": "string"},
                },
                ["projectId", "milestoneCode", "milestoneName", "wbsId", "plannedDate", "actualDate", "status"],
            ),
        ),
        function_tool(
            "create_risk",
            "Create a project risk linked to an activity.",
            schema(
                {
                    "projectId": {"type": "integer"},
                    "activityId": {"type": "integer"},
                    "riskNo": {"type": "string"},
                    "title": {"type": "string"},
                    "category": {"type": "string"},
                    "owner": {"type": "string"},
                    "probability": {"type": "integer"},
                    "impact": {"type": "integer"},
                    "status": {"type": "string"},
                    "targetDate": {"type": "string"},
                },
                [
                    "projectId",
                    "activityId",
                    "riskNo",
                    "title",
                    "category",
                    "owner",
                    "probability",
                    "impact",
                    "status",
                    "targetDate",
                ],
            ),
        ),
        function_tool(
            "create_material_request",
            "Create a material request against an activity.",
            schema(
                {
                    "requestNo": {"type": "string"},
                    "projectId": {"type": "integer"},
                    "activityId": {"type": "integer"},
                    "requestedBy": {"type": "string"},
                    "status": {"type": "string"},
                    "requestedQty": {"type": "number"},
                    "approvedQty": {"type": "number"},
                },
                ["requestNo", "projectId", "activityId", "requestedBy", "status", "requestedQty", "approvedQty"],
            ),
        ),
        function_tool(
            "create_timesheet",
            "Create a timesheet entry.",
            schema(
                {
                    "userId": {"type": "integer"},
                    "projectId": {"type": "integer"},
                    "activityId": {"type": "integer"},
                    "workDate": {"type": "string"},
                    "regularHours": {"type": "number"},
                    "overtimeHours": {"type": "number"},
                    "allocatedActivity": {"type": "boolean"},
                    "status": {"type": "string"},
                    "remarks": {"type": ["string", "null"]},
                },
                [
                    "userId",
                    "projectId",
                    "activityId",
                    "workDate",
                    "regularHours",
                    "overtimeHours",
                    "allocatedActivity",
                    "status",
                    "remarks",
                ],
            ),
        ),
        function_tool(
            "create_employee_allocation",
            "Create an employee allocation.",
            schema(
                {
                    "userId": {"type": "integer"},
                    "projectId": {"type": "integer"},
                    "activityId": {"type": "integer"},
                    "allocationDate": {"type": "string"},
                    "allocationPercentage": {"type": "integer"},
                    "active": {"type": "boolean"},
                    "remarks": {"type": ["string", "null"]},
                },
                ["userId", "projectId", "activityId", "allocationDate", "allocationPercentage", "active", "remarks"],
            ),
        ),
        function_tool(
            "create_billing",
            "Create a billing entry against a project milestone.",
            schema(
                {
                    "projectId": {"type": "integer"},
                    "milestoneId": {"type": "integer"},
                    "billingNo": {"type": "string"},
                    "billingDate": {"type": "string"},
                    "billedAmount": {"type": "number"},
                    "certifiedAmount": {"type": "number"},
                    "status": {"type": "string"},
                    "remarks": {"type": ["string", "null"]},
                },
                [
                    "projectId",
                    "milestoneId",
                    "billingNo",
                    "billingDate",
                    "billedAmount",
                    "certifiedAmount",
                    "status",
                    "remarks",
                ],
            ),
        ),
    ]


def backend_request(
    method: str,
    path: str,
    authorization: str | None,
    json_body: dict[str, Any] | None = None,
) -> Any:
    headers: dict[str, str] = {}
    if authorization:
        headers["Authorization"] = authorization

    url = f"{backend_api_base_url()}{path}"
    with httpx.Client(timeout=30.0) as client:
        response = client.request(method, url, headers=headers, json=json_body)

    if response.status_code >= 400:
        detail = ""
        try:
            payload = response.json()
            detail = payload.get("message") or payload.get("error") or response.text
        except Exception:
            detail = response.text
        raise HTTPException(status_code=400, detail=detail.strip() or f"Backend request failed for {path}")

    payload = response.json()
    return payload.get("data") if isinstance(payload, dict) and "data" in payload else payload


def summarize_success(tool_name: str, result: Any) -> str:
    if tool_name == "create_project":
        return f"Created project {result['projectCode']} ({result['projectName']})"
    if tool_name == "create_user":
        return f"Created user {result['userCode']} ({result['email']})"
    if tool_name == "create_wbs":
        return f"Created WBS {result['wbsCode']} ({result['wbsName']})"
    if tool_name == "create_activity":
        return f"Created activity {result['activityCode']} ({result['activityName']})"
    if tool_name == "create_milestone":
        return f"Created milestone {result['milestoneCode']} ({result['milestoneName']})"
    if tool_name == "create_risk":
        return f"Created risk {result['riskNo']} ({result['title']})"
    if tool_name == "create_material_request":
        return f"Created material request {result['requestNo']}"
    if tool_name == "create_timesheet":
        return f"Created timesheet entry #{result['id']}"
    if tool_name == "create_employee_allocation":
        return f"Created allocation #{result['id']}"
    if tool_name == "create_billing":
        return f"Created billing {result['billingNo']}"
    if isinstance(result, list):
        return f"Returned {len(result)} records"
    return "Action completed"


def execute_tool(tool_name: str, arguments: dict[str, Any], authorization: str | None) -> tuple[bool, str, Any]:
    try:
        if tool_name == "list_projects":
            result = backend_request("GET", "/projects", authorization)
        elif tool_name == "list_users":
            result = backend_request("GET", "/users", authorization)
        elif tool_name == "list_wbs":
            result = backend_request("GET", f"/projects/{arguments['projectId']}/wbs", authorization)
        elif tool_name == "list_activities":
            result = backend_request("GET", f"/projects/{arguments['projectId']}/activities", authorization)
        elif tool_name == "list_milestones":
            result = backend_request("GET", f"/projects/{arguments['projectId']}/milestones", authorization)
        elif tool_name == "create_project":
            body = {
                "projectCode": arguments["projectCode"],
                "projectName": arguments["projectName"],
                "clientName": arguments["clientName"],
                "projectManager": arguments["projectManager"],
                "startDate": arguments["startDate"],
                "endDate": arguments["endDate"],
                "budgetAmount": arguments["budgetAmount"],
            }
            result = backend_request("POST", "/projects", authorization, body)
        elif tool_name == "create_user":
            body = {
                "fullName": arguments["fullName"],
                "email": arguments["email"],
                "password": arguments["password"],
                "roleName": arguments["roleName"],
                "active": arguments["active"],
                "emailVerified": arguments["emailVerified"],
            }
            result = backend_request("POST", "/users", authorization, body)
        elif tool_name == "create_wbs":
            body = {
                "wbsCode": arguments["wbsCode"],
                "wbsName": arguments["wbsName"],
                "levelNo": arguments["levelNo"],
                "progressPercent": arguments["progressPercent"],
                "budgetAmount": arguments["budgetAmount"],
                "actualAmount": arguments["actualAmount"],
            }
            result = backend_request("POST", f"/projects/{arguments['projectId']}/wbs", authorization, body)
        elif tool_name == "create_activity":
            body = {
                "activityCode": arguments["activityCode"],
                "activityName": arguments["activityName"],
                "wbsId": arguments["wbsId"],
                "plannedStart": arguments["plannedStart"],
                "plannedEnd": arguments["plannedEnd"],
                "durationDays": arguments["durationDays"],
                "progressPercent": arguments["progressPercent"],
                "status": arguments["status"],
                "responsibleUser": arguments["responsibleUser"],
            }
            result = backend_request("POST", f"/projects/{arguments['projectId']}/activities", authorization, body)
        elif tool_name == "create_milestone":
            body = {
                "milestoneCode": arguments["milestoneCode"],
                "milestoneName": arguments["milestoneName"],
                "wbsId": arguments["wbsId"],
                "plannedDate": arguments["plannedDate"],
                "actualDate": arguments["actualDate"],
                "status": arguments["status"],
            }
            result = backend_request("POST", f"/projects/{arguments['projectId']}/milestones", authorization, body)
        elif tool_name == "create_risk":
            body = {
                "projectId": arguments["projectId"],
                "activityId": arguments["activityId"],
                "riskNo": arguments["riskNo"],
                "title": arguments["title"],
                "category": arguments["category"],
                "owner": arguments["owner"],
                "probability": arguments["probability"],
                "impact": arguments["impact"],
                "status": arguments["status"],
                "targetDate": arguments["targetDate"],
            }
            result = backend_request("POST", "/risks", authorization, body)
        elif tool_name == "create_material_request":
            body = {
                "requestNo": arguments["requestNo"],
                "projectId": arguments["projectId"],
                "activityId": arguments["activityId"],
                "requestedBy": arguments["requestedBy"],
                "status": arguments["status"],
                "requestedQty": arguments["requestedQty"],
                "approvedQty": arguments["approvedQty"],
            }
            result = backend_request("POST", "/material-requests", authorization, body)
        elif tool_name == "create_timesheet":
            body = {
                "userId": arguments["userId"],
                "projectId": arguments["projectId"],
                "activityId": arguments["activityId"],
                "workDate": arguments["workDate"],
                "regularHours": arguments["regularHours"],
                "overtimeHours": arguments["overtimeHours"],
                "allocatedActivity": arguments["allocatedActivity"],
                "status": arguments["status"],
                "remarks": arguments["remarks"],
            }
            result = backend_request("POST", "/timesheets", authorization, body)
        elif tool_name == "create_employee_allocation":
            body = {
                "userId": arguments["userId"],
                "projectId": arguments["projectId"],
                "activityId": arguments["activityId"],
                "allocationDate": arguments["allocationDate"],
                "allocationPercentage": arguments["allocationPercentage"],
                "active": arguments["active"],
                "remarks": arguments["remarks"],
            }
            result = backend_request("POST", "/employee-allocations", authorization, body)
        elif tool_name == "create_billing":
            body = {
                "milestoneId": arguments["milestoneId"],
                "billingNo": arguments["billingNo"],
                "billingDate": arguments["billingDate"],
                "billedAmount": arguments["billedAmount"],
                "certifiedAmount": arguments["certifiedAmount"],
                "status": arguments["status"],
                "remarks": arguments["remarks"],
            }
            result = backend_request("POST", f"/projects/{arguments['projectId']}/billings", authorization, body)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported agent tool: {tool_name}")

        return True, summarize_success(tool_name, result), result
    except HTTPException as exc:
        error_payload = {"tool": tool_name, "success": False, "error": exc.detail}
        return False, str(exc.detail), error_payload


async def openrouter_completion(messages: list[dict[str, Any]]) -> dict[str, Any]:
    payload = {
        "model": openrouter_model(),
        "messages": messages,
        "tools": tool_definitions(),
        "tool_choice": "auto",
    }
    headers = {
        "Authorization": f"Bearer {openrouter_api_key()}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(3):
            response = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            if response.status_code < 400:
                return response.json()

            if response.status_code not in {429, 503} or attempt == 2:
                try:
                    detail = response.json()
                except Exception:
                    detail = response.text
                raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {detail}")

            await asyncio.sleep(1 + attempt)

    raise HTTPException(status_code=502, detail="OpenRouter request failed after retries")


@app.post("/chat", response_model=AgentChatResponse)
async def chat(request: AgentChatRequest, authorization: str | None = Header(default=None)) -> AgentChatResponse:
    messages = build_messages(request)
    actions: list[AgentActionResult] = []
    response = await openrouter_completion(messages)

    for _ in range(MAX_TOOL_ROUNDS):
        assistant_message = response.get("choices", [{}])[0].get("message", {})
        tool_calls = assistant_message.get("tool_calls") or []
        if not tool_calls:
            content = (assistant_message.get("content") or "").strip()
            if not content and actions:
                content = f"Created {len(actions)} record actions successfully."
            if not content:
                content = "I could not complete that request."
            return AgentChatResponse(message=content, model=openrouter_model(), actions=actions)

        messages.append(assistant_message)
        for tool_call in tool_calls:
            function = tool_call.get("function", {})
            tool_name = function.get("name", "")
            raw_args = function.get("arguments", "{}")
            try:
                arguments = json.loads(raw_args)
            except json.JSONDecodeError:
                arguments = {}

            success, summary, result = execute_tool(tool_name, arguments, authorization)
            actions.append(AgentActionResult(toolName=tool_name, success=success, summary=summary))
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.get("id"),
                    "content": json.dumps(result),
                }
            )

        response = await openrouter_completion(messages)

    raise HTTPException(status_code=502, detail="Chatbot agent reached the maximum tool-call loop without producing a final response")
