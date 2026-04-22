package com.mailflow.account;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService service;

    @GetMapping
    public List<EmailAccount> list(@RequestParam String userId) {
        return service.getAccounts(userId);
    }

    @PostMapping
    public EmailAccount create(@Valid @RequestBody AccountRequest req) {
        return service.createAccount(req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
