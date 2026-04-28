package com.company.pms.auth;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/me")
    public ApiResponse<AccountProfileDto> getMyProfile() {
        return ApiResponse.ok(accountService.getCurrentProfile());
    }

    @PutMapping("/me")
    public ApiResponse<AccountProfileDto> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.ok(accountService.updateCurrentProfile(request));
    }

    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(request);
        return ApiResponse.ok("Password updated successfully.");
    }
}
