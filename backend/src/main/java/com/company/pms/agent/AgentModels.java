package com.company.pms.agent;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

record AgentActionResult(
    String toolName,
    boolean success,
    String summary
) {
}

record AgentChatMessage(
    @NotBlank String role,
    @NotBlank String content
) {
}

record AgentChatRequest(
    @NotBlank String message,
    @Valid List<AgentChatMessage> history
) {
}

record AgentChatResponse(
    String message,
    String model,
    List<AgentActionResult> actions
) {
}
