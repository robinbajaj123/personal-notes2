package com.mailflow.account;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AccountRepository extends MongoRepository<EmailAccount, String> {
    List<EmailAccount> findByUserId(String userId);
}
