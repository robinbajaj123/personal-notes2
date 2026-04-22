package com.mailflow.search;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.*;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch.core.search.HighlightField;
import com.mailflow.es.EmailDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailSearchService {

    private final ElasticsearchClient esClient;

    public SearchResult search(String userId, String query, String accountId, int from, int size) {
        try {
            BoolQuery.Builder bool = new BoolQuery.Builder()
                    .must(m -> m.multiMatch(mm -> mm
                            .query(query)
                            .fields("subject^2", "bodyText")
                    ))
                    .filter(f -> f.term(t -> t.field("userId").value(userId)));

            if (accountId != null && !accountId.isBlank()) {
                bool.filter(f -> f.term(t -> t.field("accountId").value(accountId)));
            }

            SearchRequest req = SearchRequest.of(r -> r
                    .index("emails")
                    .query(q -> q.bool(bool.build()))
                    .from(from)
                    .size(size)
                    .sort(s -> s.field(f -> f.field("receivedAt").order(co.elastic.clients.elasticsearch._types.SortOrder.Desc)))
                    .highlight(h -> h
                            .fields("subject", HighlightField.of(hf -> hf))
                            .fields("bodyText", HighlightField.of(hf -> hf.numberOfFragments(2).fragmentSize(150)))
                    )
            );

            SearchResponse<EmailDocument> resp = esClient.search(req, EmailDocument.class);

            List<SearchHit> hits = new ArrayList<>();
            for (Hit<EmailDocument> hit : resp.hits().hits()) {
                hits.add(new SearchHit(hit.source(), hit.highlight()));
            }

            long total = resp.hits().total() != null ? resp.hits().total().value() : 0;
            return new SearchResult(hits, total);

        } catch (IOException e) {
            log.error("Search failed: {}", e.getMessage());
            return new SearchResult(List.of(), 0);
        }
    }

    public record SearchHit(EmailDocument document, Map<String, List<String>> highlights) {}
    public record SearchResult(List<SearchHit> hits, long total) {}
}
