package com.mailflow.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountRequest {

    @NotBlank private String userId;
    @NotBlank private String label;

    @NotBlank private String imapHost;
    @NotNull  private Integer imapPort;
    private boolean imapSsl = true;
    @NotBlank private String imapUser;
    @NotBlank private String imapPassword;

    @NotBlank private String smtpHost;
    @NotNull  private Integer smtpPort;
    private boolean smtpSsl = true;
    @NotBlank private String smtpUser;
    @NotBlank private String smtpPassword;

    @Email @NotBlank private String fromAddress;
    @NotBlank private String fromName;

    private String provider = "other";
}
