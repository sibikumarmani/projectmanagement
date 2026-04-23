package com.company.pms.agent;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PythonAgentProxyService {

    private final RestClient restClient;
    private final String agentPythonUrl;

    public PythonAgentProxyService(@Value("${AGENT_PYTHON_URL:http://agent-python:8000}") String agentPythonUrl) {
        this.agentPythonUrl = agentPythonUrl;
        this.restClient = RestClient.builder()
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build();
    }

    public AgentChatResponse chat(AgentChatRequest request, String authorizationHeader) {
        if (!StringUtils.hasText(agentPythonUrl)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Python agent service URL is not configured");
        }

        RestClient.RequestBodySpec requestSpec = restClient.post()
            .uri(agentPythonUrl + "/chat")
            .body(request);

        if (StringUtils.hasText(authorizationHeader)) {
            requestSpec.header("Authorization", authorizationHeader);
        }

        AgentChatResponse response = requestSpec
            .retrieve()
            .body(AgentChatResponse.class);

        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Python agent service returned an empty response");
        }

        return response;
    }
}
