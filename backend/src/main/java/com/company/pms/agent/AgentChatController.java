package com.company.pms.agent;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agent")
public class AgentChatController {

    private final PythonAgentProxyService pythonAgentProxyService;

    public AgentChatController(PythonAgentProxyService pythonAgentProxyService) {
        this.pythonAgentProxyService = pythonAgentProxyService;
    }

    @PostMapping("/chat")
    public ApiResponse<AgentChatResponse> chat(
        @Valid @RequestBody AgentChatRequest request,
        @RequestHeader(value = "Authorization", required = false) String authorizationHeader
    ) {
        return ApiResponse.ok(pythonAgentProxyService.chat(request, authorizationHeader));
    }
}
