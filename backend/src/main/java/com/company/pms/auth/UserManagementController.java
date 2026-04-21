package com.company.pms.auth;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public ApiResponse<List<UserManagementDto>> getUsers() {
        return ApiResponse.ok(userManagementService.getUsers());
    }

    @PostMapping
    public ApiResponse<UserManagementDto> createUser(@Valid @RequestBody UserUpsertRequest request) {
        return ApiResponse.ok(userManagementService.createUser(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserManagementDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpsertRequest request) {
        return ApiResponse.ok(userManagementService.updateUser(id, request));
    }

    @GetMapping("/{id}/latest-reset-code")
    public ApiResponse<UserResetCodeViewDto> getLatestResetCode(@PathVariable Long id) {
        return ApiResponse.ok(userManagementService.getLatestResetCode(id));
    }
}
