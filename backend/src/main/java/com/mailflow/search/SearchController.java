package com.mailflow.search;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final EmailSearchService searchService;

    @GetMapping
    public EmailSearchService.SearchResult search(
            @RequestParam String userId,
            @RequestParam String q,
            @RequestParam(required = false) String accountId,
            @RequestParam(defaultValue = "0") int from,
            @RequestParam(defaultValue = "20") int size) {
        return searchService.search(userId, q, accountId, from, size);
    }
}
