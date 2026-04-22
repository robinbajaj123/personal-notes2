package com.mailflow.search;

import com.mailflow.es.EmailDocument;
import com.mailflow.es.EmailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailRepository emailRepo;

    @GetMapping("/{id}")
    public ResponseEntity<EmailDocument> get(@PathVariable String id) {
        return emailRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
